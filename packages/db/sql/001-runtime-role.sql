-- Apply after generated migrations using the same DATABASE_URL as the server.
-- The login must be NOSUPERUSER NOBYPASSRLS NOCREATEROLE, even if it owns tables.
-- FORCE RLS subjects table owners to the same tenant policies as other roles.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

DO $$
DECLARE t record; browser_role text;
BEGIN
  FOR t IN SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', t.tablename);
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = browser_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', t.tablename, browser_role);
      END IF;
    END LOOP;
    IF t.rowsecurity THEN
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t.tablename);
    END IF;
    IF t.tablename IN ('users', 'sessions', 'auth_accounts', 'verifications', 'organizations', 'organization_roles', 'members', 'invitations')
       OR t.rowsecurity THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', t.tablename, current_user);
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO %I', t.tablename, current_user);
    END IF;
  END LOOP;
  EXECUTE format('REVOKE ALL ON public.organization_tenant FROM %I', current_user);
  EXECUTE format('GRANT SELECT, INSERT ON public.organization_tenant TO %I', current_user);
END $$;
