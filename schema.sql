-- Astrogalaxy — Esquema de base de datos
-- Lenguaje: SQL  ·  Motor: PostgreSQL
--
-- Crear:  psql -U postgres -d astrogalaxy -f schema.sql

-- Colegios
CREATE TABLE schools (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Grados / aulas (p. ej. "5°B")
CREATE TABLE grades (
    id            SERIAL PRIMARY KEY,
    school_id     INT REFERENCES schools(id),
    label         TEXT NOT NULL,          -- "5°B"
    total_points  INT  DEFAULT 0          -- suma de puntos del grado
);

-- Usuarios (estudiantes y docentes)
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'student',  -- 'student' | 'teacher'
    grade_id      INT REFERENCES grades(id),
    points        INT  DEFAULT 0,         -- puntos individuales
    is_premium    BOOLEAN DEFAULT false,  -- suscripción $15/mes activa
    wallet        TEXT,                   -- wallet para recibir NFTs
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Retos
CREATE TABLE challenges (
    id           TEXT PRIMARY KEY,        -- "no-plastic-week"
    title        TEXT NOT NULL,
    description  TEXT,
    points       INT  NOT NULL,
    difficulty   TEXT,                    -- 'easy' | 'medium' | 'hard'
    is_premium   BOOLEAN DEFAULT false,
    nft_name     TEXT,                    -- NFT que otorga
    nft_rarity   TEXT DEFAULT 'common'    -- 'common' | 'rare' | 'unique'
);

-- Evidencias (fotos subidas)
CREATE TABLE evidence (
    id            SERIAL PRIMARY KEY,
    user_id       INT  REFERENCES users(id),
    challenge_id  TEXT REFERENCES challenges(id),
    photo_url     TEXT NOT NULL,
    phash         TEXT,                   -- hash perceptual (anti-repetidos)
    ai_verified   BOOLEAN,
    ai_confidence NUMERIC(4,3),
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- Registro de puntos otorgados
CREATE TABLE points_log (
    id            SERIAL PRIMARY KEY,
    user_id       INT REFERENCES users(id),
    evidence_id   INT REFERENCES evidence(id),
    points        INT NOT NULL,
    multiplier    NUMERIC(3,1) DEFAULT 1.0,  -- 2.0 si es Premium
    created_at    TIMESTAMPTZ DEFAULT now()
);

-- NFTs emitidas
CREATE TABLE nfts (
    id            SERIAL PRIMARY KEY,
    user_id       INT REFERENCES users(id),
    challenge_id  TEXT REFERENCES challenges(id),
    token_id      BIGINT,                 -- id en el contrato ERC-721
    name          TEXT,
    rarity        TEXT,                   -- 'common' | 'rare' | 'unique'
    minted_at     TIMESTAMPTZ DEFAULT now()
);

-- Ranking por grado:
--   SELECT g.label, g.total_points
--   FROM grades g ORDER BY g.total_points DESC LIMIT 10;

-- Ranking individual:
--   SELECT u.name, u.points
--   FROM users u WHERE u.role = 'student' ORDER BY u.points DESC LIMIT 10;
