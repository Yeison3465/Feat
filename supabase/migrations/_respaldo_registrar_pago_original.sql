-- Version ORIGINAL de registrar_pago_transaccional (antes del abono a capital).
-- Para volver atras: DROP FUNCTION public.registrar_pago_transaccional(uuid, numeric, uuid, text, text, timestamp with time zone, numeric); y ejecutar esto.

CREATE OR REPLACE FUNCTION public.registrar_pago_transaccional(p_prestamo_id uuid, p_monto numeric, p_clave_idempotencia uuid, p_metodo_pago text DEFAULT 'efectivo'::text, p_notas text DEFAULT NULL::text, p_fecha_recepcion timestamp with time zone DEFAULT now())
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

  INSERT INTO public.pagos (
    propietario_id, prestamo_id, clave_idempotencia, monto, metodo_pago, notas, fecha_recepcion, es_reverso
  ) VALUES (
    v_propietario_id, p_prestamo_id, p_clave_idempotencia, round(p_monto), coalesce(p_metodo_pago, 'efectivo'), p_notas, coalesce(p_fecha_recepcion, now()), false
  ) RETURNING * INTO v_nuevo_pago;

  v_pago_id := v_nuevo_pago.id;

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
