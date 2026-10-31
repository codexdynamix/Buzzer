CREATE OR REPLACE FUNCTION public.jsonb_set_deep(
  p_document jsonb,
  p_path text[],
  p_value jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_parent jsonb;
BEGIN
  IF cardinality(p_path) = 1 THEN
    RETURN jsonb_set(COALESCE(p_document, '{}'::jsonb), p_path, p_value, true);
  END IF;

  v_parent := p_document -> p_path[1];
  IF jsonb_typeof(v_parent) IS DISTINCT FROM 'object' THEN
    v_parent := '{}'::jsonb;
  END IF;

  RETURN jsonb_set(
    COALESCE(p_document, '{}'::jsonb),
    ARRAY[p_path[1]],
    public.jsonb_set_deep(v_parent, p_path[2:], p_value),
    true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_app_record_update(
  p_document jsonb,
  p_update jsonb,
  p_is_insert boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb := p_document;
  v_operator text;
  v_path text[];
  v_key text;
  v_value jsonb;
  v_current jsonb;
  v_current_number numeric;
BEGIN
  FOREACH v_operator IN ARRAY ARRAY['$setOnInsert', '$set', '$inc', '$unset', '$addToSet']
  LOOP
    IF v_operator = '$setOnInsert' AND NOT p_is_insert THEN
      CONTINUE;
    END IF;

    FOR v_key, v_value IN
      SELECT key, value
      FROM jsonb_each(COALESCE(p_update -> v_operator, '{}'::jsonb))
    LOOP
      v_path := string_to_array(v_key, '.');
      IF cardinality(v_path) = 0 OR v_path @> ARRAY[''] THEN
        RAISE EXCEPTION 'Invalid JSON document update path';
      END IF;

      CASE v_operator
        WHEN '$set', '$setOnInsert' THEN
          v_result := public.jsonb_set_deep(v_result, v_path, v_value);
        WHEN '$inc' THEN
          v_current := v_result #> v_path;
          IF v_current IS NULL OR v_current = 'null'::jsonb THEN
            v_current_number := 0;
          ELSE
            v_current_number := (v_current #>> '{}')::numeric;
          END IF;
          v_result := public.jsonb_set_deep(
            v_result,
            v_path,
            to_jsonb(v_current_number + (v_value #>> '{}')::numeric)
          );
        WHEN '$unset' THEN
          v_result := v_result #- v_path;
        WHEN '$addToSet' THEN
          v_current := v_result #> v_path;
          IF jsonb_typeof(v_current) IS DISTINCT FROM 'array' THEN
            v_current := '[]'::jsonb;
          END IF;
          IF NOT (v_current @> jsonb_build_array(v_value)) THEN
            v_current := v_current || jsonb_build_array(v_value);
          END IF;
          v_result := public.jsonb_set_deep(v_result, v_path, v_current);
      END CASE;
    END LOOP;
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_app_record(
  p_collection text,
  p_id text,
  p_initial_document jsonb,
  p_update jsonb,
  p_upsert boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_document jsonb;
BEGIN
  IF p_collection IS NULL OR p_collection = '' OR p_id IS NULL OR p_id = '' THEN
    RAISE EXCEPTION 'Collection and record ID are required';
  END IF;

  IF p_upsert THEN
    INSERT INTO public.app_records (collection, id, document)
    VALUES (
      p_collection,
      p_id,
      public.apply_app_record_update(p_initial_document, p_update, true)
    )
    ON CONFLICT (collection, id) DO UPDATE
      SET document = public.apply_app_record_update(app_records.document, p_update, false),
          updated_at = now()
    RETURNING document INTO v_document;
    RETURN v_document;
  END IF;

  UPDATE public.app_records
  SET document = public.apply_app_record_update(document, p_update, false),
      updated_at = now()
  WHERE collection = p_collection AND id = p_id
  RETURNING document INTO v_document;

  RETURN v_document;
END;
$$;

REVOKE ALL ON FUNCTION public.jsonb_set_deep(jsonb, text[], jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_app_record_update(jsonb, jsonb, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_app_record(text, text, jsonb, jsonb, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jsonb_set_deep(jsonb, text[], jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_app_record_update(jsonb, jsonb, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_app_record(text, text, jsonb, jsonb, boolean) TO service_role;
