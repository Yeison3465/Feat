-- Versiones vigentes ANTES del recalculo de interes (registrar con abono a capital + reversar original).

CREATE OR REPLACE FUNCTION public.registrar_pago_transaccional(p_prestamo_id uuid, p_monto numeric, p_clave_idempotencia uuid, p_metodo_pago text DEFAULT 'efectivo'::text, p_notas text DEFAULT NULL::text, p_fecha_recepcion timestamp with time zone DEFAULT now(), p_monto_capital numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_propietario_id uuid;
  v_prestamo record;
  v_pago_existente record;
  v_nuevo_pago record;
  v_pago_id uuid;
  v_monto_restante numeric := round(p_monto);
  v_cuota record;
  v_ultima_cuota record;
  v_ultima_cuota_id uuid;
  v_mora_a_pagar numeric;
  v_interes_a_pagar numeric;
  v_capital_a_pagar numeric;
  v_total_pagado_capital numeric := 0;
  v_total_pagado_interes numeric := 0;
  v_total_pagado_mora numeric := 0;
  v_capital_pagado_previo numeric := 0;
  v_capital_pendiente_global numeric := 0;
  v_interes_pendiente_global numeric := 0;
  v_mora_pendiente_global numeric := 0;
  v_saldo_exigible_total numeric := 0;
  v_nuevo_capital_pagado_total numeric := 0;
  v_nuevo_capital_pendiente numeric := 0;
  v_proxima_fecha date;
  v_tasa_aplicable numeric;
  v_nuevo_interes numeric;
  v_nuevo_capital_cuota numeric;
  v_cuota_rollover_id uuid := null;
  v_tiene_vencidas boolean := false;
  v_capital_directo numeric := 0;
  v_cap_dir_restante numeric := 0;
  v_cuota_dir record;
  v_cuota_dir_id uuid;
  v_aplicar numeric;
BEGIN
  v_propietario_id := auth.uid();
  IF v_propietario_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para registrar un pago.';
  END IF;

  IF p_monto IS NULL OR p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto del pago debe ser mayor a 0.';
  END IF;

  SELECT * INTO v_pago_existente
  FROM public.pagos
  WHERE propietario_id = v_propietario_id AND clave_idempotencia = p_clave_idempotencia;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'estado', 'ya_procesado',
      'id', v_pago_existente.id,
      'pago_id', v_pago_existente.id,
      'prestamo_id', v_pago_existente.prestamo_id,
      'propietario_id', v_pago_existente.propietario_id,
      'monto', v_pago_existente.monto,
      'fecha_recepcion', v_pago_existente.fecha_recepcion,
      'metodo_pago', v_pago_existente.metodo_pago,
      'notas', v_pago_existente.notas,
      'es_reverso', v_pago_existente.es_reverso,
      'creado_en', v_pago_existente.creado_en,
      'mensaje', 'Este pago ya fue registrado previamente.'
    );
  END IF;

  SELECT p.*, per.exento_interes_ordinario
  INTO v_prestamo
  FROM public.prestamos p
  JOIN public.personas per ON per.id = p.persona_id AND per.propietario_id = p.propietario_id
  WHERE p.id = p_prestamo_id AND p.propietario_id = v_propietario_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El préstamo seleccionado no existe o no pertenece a tu cuenta.';
  END IF;

  IF v_prestamo.estado IN ('completado', 'cancelado') THEN
    RAISE EXCEPTION 'No se pueden registrar pagos en un préstamo que ya está %.', v_prestamo.estado;
  END IF;

  PERFORM 1
  FROM public.cuotas
  WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id
  FOR UPDATE;

  SELECT coalesce(sum(capital_pagado), 0)
  INTO v_capital_pagado_previo
  FROM public.cuotas
  WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id;

  v_capital_pendiente_global := greatest(0, v_prestamo.capital_original - v_capital_pagado_previo);

  SELECT
    coalesce(sum(greatest(0, interes_esperado - interes_pagado)), 0),
    coalesce(sum(greatest(0, mora_acumulada - mora_pagada)), 0)
  INTO v_interes_pendiente_global, v_mora_pendiente_global
  FROM public.cuotas
  WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada;

  v_saldo_exigible_total := v_capital_pendiente_global + v_interes_pendiente_global + v_mora_pendiente_global;

  IF v_monto_restante > v_saldo_exigible_total AND v_saldo_exigible_total > 0 THEN
    RAISE EXCEPTION 'El monto ingresado ($%) supera el saldo total adeudado del préstamo ($%).', v_monto_restante, v_saldo_exigible_total;
  END IF;

  IF p_monto_capital IS NOT NULL AND p_monto_capital > 0 THEN
    v_capital_directo := round(p_monto_capital);
    IF v_capital_directo > round(p_monto) THEN
      RAISE EXCEPTION 'El abono a capital ($%) no puede superar el monto del pago ($%).', v_capital_directo, round(p_monto);
    END IF;
    IF v_capital_directo > v_capital_pendiente_global THEN
      RAISE EXCEPTION 'El abono a capital ($%) supera el capital pendiente del préstamo ($%).', v_capital_directo, v_capital_pendiente_global;
    END IF;
  END IF;

  INSERT INTO public.pagos (
    propietario_id, prestamo_id, clave_idempotencia, monto, metodo_pago, notas, fecha_recepcion, es_reverso
  ) VALUES (
    v_propietario_id, p_prestamo_id, p_clave_idempotencia, round(p_monto), coalesce(p_metodo_pago, 'efectivo'), p_notas, coalesce(p_fecha_recepcion, now()), false
  ) RETURNING * INTO v_nuevo_pago;

  v_pago_id := v_nuevo_pago.id;

  -- Abono a capital elegido por el usuario: se aplica primero al capital exigible de las
  -- cuotas abiertas (en orden) y el resto a la cuota abierta mas reciente. Lo que sobre del
  -- monto sigue la prelacion normal (mora -> interes -> capital).
  IF v_capital_directo > 0 THEN
    v_cap_dir_restante := v_capital_directo;

    FOR v_cuota_dir IN (
      SELECT *
      FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada
      ORDER BY numero_cuota ASC, fecha_vencimiento ASC
    ) LOOP
      EXIT WHEN v_cap_dir_restante <= 0;
      IF (v_cuota_dir.capital_esperado - v_cuota_dir.capital_pagado) > 0 THEN
        v_aplicar := least(v_cap_dir_restante, v_cuota_dir.capital_esperado - v_cuota_dir.capital_pagado);
        v_cap_dir_restante := v_cap_dir_restante - v_aplicar;
        v_total_pagado_capital := v_total_pagado_capital + v_aplicar;

        UPDATE public.cuotas SET capital_pagado = capital_pagado + v_aplicar WHERE id = v_cuota_dir.id;
        INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
        VALUES (v_propietario_id, v_pago_id, v_cuota_dir.id, 'capital', v_aplicar);
      END IF;
    END LOOP;

    IF v_cap_dir_restante > 0 THEN
      SELECT id INTO v_cuota_dir_id
      FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada
      ORDER BY numero_cuota DESC
      LIMIT 1;

      IF v_cuota_dir_id IS NULL THEN
        SELECT id INTO v_cuota_dir_id
        FROM public.cuotas
        WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id
        ORDER BY numero_cuota DESC
        LIMIT 1;
      END IF;

      UPDATE public.cuotas SET capital_pagado = capital_pagado + v_cap_dir_restante WHERE id = v_cuota_dir_id;
      INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
      VALUES (v_propietario_id, v_pago_id, v_cuota_dir_id, 'capital', v_cap_dir_restante);
      v_total_pagado_capital := v_total_pagado_capital + v_cap_dir_restante;
    END IF;

    v_monto_restante := v_monto_restante - v_capital_directo;

    -- Mismo criterio de liquidacion que el reparto normal
    UPDATE public.cuotas
    SET esta_liquidada = (capital_pagado >= capital_esperado AND interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada),
        fecha_liquidacion = CASE
          WHEN (capital_pagado >= capital_esperado AND interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada)
          THEN coalesce(p_fecha_recepcion, now())
          ELSE NULL
        END
    WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada;
  END IF;

  FOR v_cuota IN (
    SELECT *
    FROM public.cuotas
    WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada
    ORDER BY numero_cuota ASC, fecha_vencimiento ASC
  ) LOOP
    v_ultima_cuota_id := v_cuota.id;
    EXIT WHEN v_monto_restante <= 0;

    IF (v_cuota.mora_acumulada - v_cuota.mora_pagada) > 0 THEN
      v_mora_a_pagar := least(v_monto_restante, v_cuota.mora_acumulada - v_cuota.mora_pagada);
      v_monto_restante := v_monto_restante - v_mora_a_pagar;
      v_total_pagado_mora := v_total_pagado_mora + v_mora_a_pagar;

      UPDATE public.cuotas SET mora_pagada = mora_pagada + v_mora_a_pagar WHERE id = v_cuota.id;
      INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
      VALUES (v_propietario_id, v_pago_id, v_cuota.id, 'mora', v_mora_a_pagar);
    END IF;

    IF v_monto_restante > 0 AND (v_cuota.interes_esperado - v_cuota.interes_pagado) > 0 THEN
      v_interes_a_pagar := least(v_monto_restante, v_cuota.interes_esperado - v_cuota.interes_pagado);
      v_monto_restante := v_monto_restante - v_interes_a_pagar;
      v_total_pagado_interes := v_total_pagado_interes + v_interes_a_pagar;

      UPDATE public.cuotas SET interes_pagado = interes_pagado + v_interes_a_pagar WHERE id = v_cuota.id;
      INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
      VALUES (v_propietario_id, v_pago_id, v_cuota.id, 'interes', v_interes_a_pagar);
    END IF;

    IF v_monto_restante > 0 AND (v_cuota.capital_esperado - v_cuota.capital_pagado) > 0 THEN
      v_capital_a_pagar := least(v_monto_restante, v_cuota.capital_esperado - v_cuota.capital_pagado);
      v_monto_restante := v_monto_restante - v_capital_a_pagar;
      v_total_pagado_capital := v_total_pagado_capital + v_capital_a_pagar;

      UPDATE public.cuotas SET capital_pagado = capital_pagado + v_capital_a_pagar WHERE id = v_cuota.id;
      INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
      VALUES (v_propietario_id, v_pago_id, v_cuota.id, 'capital', v_capital_a_pagar);
    END IF;

    IF v_prestamo.tipo_amortizacion = 'pago_unico' THEN
      UPDATE public.cuotas
      SET capital_esperado = CASE
            WHEN interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada AND capital_pagado < capital_esperado
            THEN capital_pagado
            ELSE capital_esperado
          END
      WHERE id = v_cuota.id;
    END IF;

    UPDATE public.cuotas
    SET esta_liquidada = (capital_pagado >= capital_esperado AND interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada),
        fecha_liquidacion = CASE
          WHEN (capital_pagado >= capital_esperado AND interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada)
          THEN coalesce(p_fecha_recepcion, now())
          ELSE NULL
        END
    WHERE id = v_cuota.id;
  END LOOP;

  IF v_monto_restante > 0 THEN
    IF v_ultima_cuota_id IS NULL THEN
      SELECT id INTO v_ultima_cuota_id
      FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id
      ORDER BY numero_cuota DESC
      LIMIT 1;
    END IF;

    IF v_ultima_cuota_id IS NOT NULL THEN
      UPDATE public.cuotas
      SET capital_pagado = capital_pagado + v_monto_restante
      WHERE id = v_ultima_cuota_id;
    END IF;

    v_total_pagado_capital := v_total_pagado_capital + v_monto_restante;

    INSERT INTO public.distribucion_pagos(propietario_id, pago_id, cuota_id, componente, monto)
    VALUES (v_propietario_id, v_pago_id, v_ultima_cuota_id, 'capital', v_monto_restante);

    v_monto_restante := 0;
  END IF;

  SELECT coalesce(sum(capital_pagado), 0)
  INTO v_nuevo_capital_pagado_total
  FROM public.cuotas
  WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id;

  v_nuevo_capital_pendiente := greatest(0, v_prestamo.capital_original - v_nuevo_capital_pagado_total);

  IF v_nuevo_capital_pendiente <= 0 THEN
    UPDATE public.cuotas
    SET esta_liquidada = true,
        fecha_liquidacion = coalesce(fecha_liquidacion, p_fecha_recepcion, now())
    WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada;

    UPDATE public.prestamos
    SET estado = 'completado', actualizado_en = now()
    WHERE id = p_prestamo_id AND propietario_id = v_propietario_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id AND NOT esta_liquidada
    ) AND v_prestamo.tipo_amortizacion IN ('solo_interes', 'pago_unico') THEN
      SELECT * INTO v_ultima_cuota
      FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id AND propietario_id = v_propietario_id
      ORDER BY numero_cuota DESC
      LIMIT 1;

      v_proxima_fecha := (v_ultima_cuota.fecha_vencimiento + interval '1 month')::date;
      v_tasa_aplicable := CASE WHEN coalesce(v_prestamo.exento_interes_ordinario, false) THEN 0 ELSE v_prestamo.tasa_mensual END;
      v_nuevo_interes := round(v_nuevo_capital_pendiente * (v_tasa_aplicable / 100.0));
      v_nuevo_capital_cuota := CASE WHEN v_prestamo.tipo_amortizacion = 'pago_unico' THEN v_nuevo_capital_pendiente ELSE 0 END;

      INSERT INTO public.cuotas (
        propietario_id, prestamo_id, numero_cuota, fecha_vencimiento,
        capital_esperado, interes_esperado, capital_pagado, interes_pagado,
        mora_acumulada, mora_pagada, esta_liquidada
      ) VALUES (
        v_propietario_id, p_prestamo_id, v_ultima_cuota.numero_cuota + 1, v_proxima_fecha,
        v_nuevo_capital_cuota, v_nuevo_interes, 0, 0,
        0, 0, false
      ) RETURNING id INTO v_cuota_rollover_id;

      UPDATE public.prestamos
      SET fecha_vencimiento_final = v_proxima_fecha, actualizado_en = now()
      WHERE id = p_prestamo_id AND propietario_id = v_propietario_id;
    END IF;

    -- Evaluar si el préstamo sigue teniendo cuotas vencidas o si pasa a 'activo'
    SELECT EXISTS (
      SELECT 1 FROM public.cuotas
      WHERE prestamo_id = p_prestamo_id
        AND propietario_id = v_propietario_id
        AND NOT esta_liquidada
        AND fecha_vencimiento < current_date
    ) INTO v_tiene_vencidas;

    UPDATE public.prestamos
    SET estado = CASE WHEN v_tiene_vencidas THEN 'en_mora'::estado_prestamo ELSE 'activo'::estado_prestamo END,
        actualizado_en = now()
    WHERE id = p_prestamo_id AND propietario_id = v_propietario_id;
  END IF;

  INSERT INTO public.movimientos_prestamo (
    propietario_id, prestamo_id, tipo_movimiento, monto, fecha_efectiva, pago_origen_id, notas, metadatos
  ) VALUES (
    v_propietario_id,
    p_prestamo_id,
    'pago',
    round(p_monto),
    coalesce(p_fecha_recepcion, now()),
    v_pago_id,
    coalesce(nullif(trim(p_notas), ''), 'Pago recibido por ' || coalesce(p_metodo_pago, 'efectivo')),
    jsonb_build_object(
      'capital_pagado', v_total_pagado_capital,
      'interes_pagado', v_total_pagado_interes,
      'mora_pagada', v_total_pagado_mora,
      'abono_capital_directo', v_capital_directo,
      'capital_pendiente_restante', v_nuevo_capital_pendiente,
      'cuota_rollover_id', v_cuota_rollover_id
    )
  );

  RETURN jsonb_build_object(
    'estado', 'exito',
    'id', v_nuevo_pago.id,
    'pago_id', v_nuevo_pago.id,
    'prestamo_id', v_nuevo_pago.prestamo_id,
    'propietario_id', v_nuevo_pago.propietario_id,
    'monto', v_nuevo_pago.monto,
    'fecha_recepcion', v_nuevo_pago.fecha_recepcion,
    'metodo_pago', v_nuevo_pago.metodo_pago,
    'notas', v_nuevo_pago.notas,
    'es_reverso', v_nuevo_pago.es_reverso,
    'creado_en', v_nuevo_pago.creado_en,
    'capital_abonado', v_total_pagado_capital,
    'interes_abonado', v_total_pagado_interes,
    'mora_abonada', v_total_pagado_mora,
    'capital_pendiente', v_nuevo_capital_pendiente
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reversar_pago_transaccional(p_pago_id uuid, p_motivo text DEFAULT 'Corrección de operación'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_propietario_id uuid;
  v_pago_original record;
  v_prestamo record;
  v_mov_original record;
  v_dist record;
  v_pago_reverso record;
  v_rollover_cuota_id uuid;
  v_capital_pagado_total numeric := 0;
  v_capital_otras_cuotas numeric := 0;
BEGIN
  v_propietario_id := auth.uid();
  IF v_propietario_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para reversar un pago.';
  END IF;

  -- 1. Obtener y bloquear el pago original
  SELECT * INTO v_pago_original
  FROM public.pagos
  WHERE id = p_pago_id AND propietario_id = v_propietario_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El pago indicado no existe o no tienes permisos sobre él.';
  END IF;

  IF v_pago_original.es_reverso THEN
    RAISE EXCEPTION 'No se puede reversar un registro que ya corresponde a un reverso.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pagos
    WHERE pago_reversado_id = p_pago_id AND propietario_id = v_propietario_id
  ) THEN
    RAISE EXCEPTION 'Este pago ya fue reversado anteriormente.';
  END IF;

  -- 2. Bloquear el préstamo y sus cuotas
  SELECT * INTO v_prestamo
  FROM public.prestamos
  WHERE id = v_pago_original.prestamo_id AND propietario_id = v_propietario_id
  FOR UPDATE;

  PERFORM 1
  FROM public.cuotas
  WHERE prestamo_id = v_pago_original.prestamo_id AND propietario_id = v_propietario_id
  FOR UPDATE;

  -- 3. Localizar el movimiento original para vincular trazabilidad y verificar si generó cuota de rollover
  SELECT * INTO v_mov_original
  FROM public.movimientos_prestamo
  WHERE pago_origen_id = p_pago_id AND propietario_id = v_propietario_id AND tipo_movimiento = 'pago'
  ORDER BY creado_en DESC
  LIMIT 1;

  IF v_mov_original.id IS NOT NULL AND v_mov_original.metadatos ? 'cuota_rollover_id' THEN
    BEGIN
      v_rollover_cuota_id := (v_mov_original.metadatos->>'cuota_rollover_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_rollover_cuota_id := NULL;
    END;
  END IF;

  -- Si existe un pago posterior activo en el mismo préstamo, impedir reversar un pago intermedio para proteger la cascada cronológica
  IF EXISTS (
    SELECT 1 FROM public.pagos p
    WHERE p.prestamo_id = v_pago_original.prestamo_id
      AND p.propietario_id = v_propietario_id
      AND p.creado_en > v_pago_original.creado_en
      AND p.es_reverso = false
      AND NOT EXISTS (
        SELECT 1 FROM public.pagos rev
        WHERE rev.pago_reversado_id = p.id AND rev.propietario_id = v_propietario_id
      )
  ) THEN
    RAISE EXCEPTION 'Debes reversar primero los pagos más recientes de este préstamo para mantener la consistencia cronológica.';
  END IF;

  -- 4. Revertir las imputaciones en las cuotas afectadas
  FOR v_dist IN (
    SELECT * FROM public.distribucion_pagos
    WHERE pago_id = p_pago_id AND propietario_id = v_propietario_id
  ) LOOP
    IF v_dist.cuota_id IS NOT NULL THEN
      IF v_dist.componente = 'mora' THEN
        UPDATE public.cuotas
        SET mora_pagada = greatest(0, mora_pagada - v_dist.monto)
        WHERE id = v_dist.cuota_id AND propietario_id = v_propietario_id;
      ELSIF v_dist.componente = 'interes' THEN
        UPDATE public.cuotas
        SET interes_pagado = greatest(0, interes_pagado - v_dist.monto)
        WHERE id = v_dist.cuota_id AND propietario_id = v_propietario_id;
      ELSIF v_dist.componente = 'capital' THEN
        UPDATE public.cuotas
        SET capital_pagado = greatest(0, capital_pagado - v_dist.monto)
        WHERE id = v_dist.cuota_id AND propietario_id = v_propietario_id;
      END IF;

      -- Si es modalidad pago_unico, restaurar el capital_esperado de la cuota al saldo de capital exigible
      IF v_prestamo.tipo_amortizacion = 'pago_unico' THEN
        SELECT coalesce(sum(capital_pagado), 0) INTO v_capital_otras_cuotas
        FROM public.cuotas
        WHERE prestamo_id = v_prestamo.id AND propietario_id = v_propietario_id AND id <> v_dist.cuota_id;

        UPDATE public.cuotas
        SET capital_esperado = greatest(capital_pagado, v_prestamo.capital_original - v_capital_otras_cuotas)
        WHERE id = v_dist.cuota_id AND propietario_id = v_propietario_id;
      END IF;

      -- Recalcular estado de liquidación de la cuota
      UPDATE public.cuotas
      SET esta_liquidada = (
            capital_pagado >= capital_esperado
            AND interes_pagado >= interes_esperado
            AND mora_pagada >= mora_acumulada
            AND (interes_esperado > 0 OR capital_esperado > 0)
          ),
          fecha_liquidacion = CASE
            WHEN (capital_pagado >= capital_esperado AND interes_pagado >= interes_esperado AND mora_pagada >= mora_acumulada AND (interes_esperado > 0 OR capital_esperado > 0))
            THEN fecha_liquidacion
            ELSE NULL
          END
      WHERE id = v_dist.cuota_id AND propietario_id = v_propietario_id;
    END IF;
  END LOOP;

  -- 5. Si el pago había autogenerado una cuota de rollover sin pagos aplicados, retirarla
  IF v_rollover_cuota_id IS NOT NULL THEN
    DELETE FROM public.cuotas
    WHERE id = v_rollover_cuota_id
      AND propietario_id = v_propietario_id
      AND capital_pagado = 0
      AND interes_pagado = 0
      AND mora_pagada = 0
      AND NOT EXISTS (
        SELECT 1 FROM public.distribucion_pagos dp WHERE dp.cuota_id = v_rollover_cuota_id
      );
  END IF;

  -- 6. Insertar registro compensatorio en pagos (es_reverso = true)
  INSERT INTO public.pagos (
    propietario_id, prestamo_id, clave_idempotencia, monto, metodo_pago, fecha_recepcion, notas, es_reverso, pago_reversado_id
  ) VALUES (
    v_propietario_id,
    v_pago_original.prestamo_id,
    gen_random_uuid(),
    v_pago_original.monto,
    v_pago_original.metodo_pago,
    now(),
    coalesce(nullif(trim(p_motivo), ''), 'Reverso contable de pago'),
    true,
    v_pago_original.id
  ) RETURNING * INTO v_pago_reverso;

  -- 7. Insertar asiento compensatorio en movimientos_prestamo (tipo_movimiento = 'reverso')
  INSERT INTO public.movimientos_prestamo (
    propietario_id, prestamo_id, tipo_movimiento, monto, fecha_efectiva, pago_origen_id, movimiento_reversado_id, notas, metadatos
  ) VALUES (
    v_propietario_id,
    v_pago_original.prestamo_id,
    'reverso',
    v_pago_original.monto,
    now(),
    v_pago_reverso.id,
    v_mov_original.id,
    coalesce(nullif(trim(p_motivo), ''), 'Reverso contable de pago'),
    jsonb_build_object(
      'pago_reversado_id', v_pago_original.id,
      'monto_reversado', v_pago_original.monto,
      'motivo', coalesce(nullif(trim(p_motivo), ''), 'Corrección de operación')
    )
  );

  -- 8. Actualizar estado del préstamo si había sido marcado como completado
  SELECT coalesce(sum(capital_pagado), 0)
  INTO v_capital_pagado_total
  FROM public.cuotas
  WHERE prestamo_id = v_prestamo.id AND propietario_id = v_propietario_id;

  IF v_capital_pagado_total < v_prestamo.capital_original AND v_prestamo.estado = 'completado' THEN
    UPDATE public.prestamos
    SET estado = 'activo', actualizado_en = now()
    WHERE id = v_prestamo.id AND propietario_id = v_propietario_id;
  END IF;

  RETURN jsonb_build_object(
    'estado', 'reversado',
    'reverso_id', v_pago_reverso.id,
    'pago_reversado_id', v_pago_original.id,
    'monto', v_pago_original.monto,
    'capital_pendiente', greatest(0, v_prestamo.capital_original - v_capital_pagado_total)
  );
END;
$function$
;
