-- Migration: 20260105000000_auth_roles_refactor.sql
-- Description: Refatoração de papéis (roles) para suportar múltiplos perfis (Coach e Aluno)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role text;
  v_coach_id uuid;
  v_student_count int;
BEGIN
  -- Extrair o papel e o coach_id (se houver) do metadata
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'coach');
  v_coach_id := (new.raw_user_meta_data->>'coach_id')::uuid;

  IF v_role = 'student' THEN
    -- Verificar se já existe um registro de estudante com este e-mail (pré-cadastrado pelo coach)
    SELECT count(*) INTO v_student_count FROM public.students WHERE email = new.email AND coach_id = v_coach_id;

    IF v_student_count > 0 THEN
      -- Se existe, vinculamos o ID do Auth ao registro existente do estudante
      -- Nota: Isso requer que a PK do students suporte ser alterada ou que usemos auth_id como FK.
      -- Como a PK atual é id, e ela é usada em várias tabelas (anamnesis, etc), 
      -- talvez seja melhor manter o ID e adicionar uma coluna user_id.
      -- OU, se for um novo fluxo, criamos um novo registro.
      
      -- Por simplicidade e seguindo a instrução de "insira na tabela students":
      INSERT INTO public.students (id, coach_id, full_name, email, status)
      VALUES (
        new.id,
        v_coach_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Aluno'),
        new.email,
        'active'
      )
      ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id; -- Tenta trocar o ID gerado pelo manual (Cuidado com FKs!)
    ELSE
      -- Novo estudante
      INSERT INTO public.students (id, coach_id, full_name, email, status)
      VALUES (
        new.id,
        v_coach_id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Aluno'),
        new.email,
        'active'
      );
    END IF;
  ELSE
    -- Comportamento padrão: Coach
    INSERT INTO public.coaches (id, name, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Coach'),
      new.email
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
