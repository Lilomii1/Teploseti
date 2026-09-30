-- ============================================================
-- БАЗА ДАННЫХ "ТЕПЛОСЕТЬ"
-- PostgreSQL
-- ============================================================

-- 1. БЛОК «ЛЮДИ И РОЛИ»
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    login VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brigades (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    foreman_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. БЛОК «ПАСПОРТИЗАЦИЯ»
CREATE TABLE IF NOT EXISTS facility_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    color VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES facilities(id) ON DELETE CASCADE,
    type_id INTEGER REFERENCES facility_types(id),
    name VARCHAR(200) NOT NULL,
    address TEXT,
    install_date DATE,
    lifespan_years INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. БЛОК «СКЛАД И АВТОПАРК»
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    min_stock DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2),
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS warehouse (
    id SERIAL PRIMARY KEY,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    current_quantity DECIMAL(10,2) DEFAULT 0,
    reserved_quantity DECIMAL(10,2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    plate_number VARCHAR(20) UNIQUE,
    status VARCHAR(20) DEFAULT 'free',
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. БЛОК «ЗАЯВКИ И РЕМОНТЫ»
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_type VARCHAR(20) NOT NULL,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
    creator_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    brigade_id INTEGER REFERENCES brigades(id) ON DELETE SET NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'new',
    description TEXT,
    solution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    planned_date DATE
);

-- 5. БЛОК «СВЯЗИ И ЗАТРАТЫ»
CREATE TABLE IF NOT EXISTS ticket_materials (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    material_id INTEGER REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS ticket_vehicles (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    hours_used DECIMAL(8,2) DEFAULT 0,
    fuel_used DECIMAL(10,2)
);

-- 6. БЛОК «ДОКУМЕНТЫ»
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL,
    doc_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'generated',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. БЛОК «ЖУРНАЛ ДЕЙСТВИЙ»
CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ИНДЕКСЫ
CREATE INDEX idx_facilities_parent_id ON facilities(parent_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_warehouse_material_id ON warehouse(material_id);
CREATE INDEX idx_action_logs_user_id ON action_logs(user_id);