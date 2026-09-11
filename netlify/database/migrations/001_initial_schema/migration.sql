CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  city TEXT DEFAULT '',
  birthday DATE,
  source TEXT DEFAULT '',
  status TEXT DEFAULT 'Ativo',
  total_spent NUMERIC(14,2) NOT NULL DEFAULT 0,
  last_purchase DATE,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  size TEXT DEFAULT '',
  color TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(14,2) NOT NULL DEFAULT 0,
  cost NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  client_id TEXT,
  sale_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none',
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  items INTEGER NOT NULL DEFAULT 0,
  payment TEXT DEFAULT 'Pix',
  payment_terms TEXT DEFAULT '',
  condition TEXT DEFAULT 'full',
  due_date DATE
);

CREATE TABLE IF NOT EXISTS sale_lines (
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  product_id TEXT,
  product TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  size TEXT DEFAULT '',
  color TEXT DEFAULT '',
  category TEXT DEFAULT '',
  PRIMARY KEY (sale_id, line_no)
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  method TEXT DEFAULT 'Pix',
  terms TEXT DEFAULT '',
  note TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'Operacional',
  amount NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  entry_date DATE NOT NULL,
  product_id TEXT,
  product_code TEXT DEFAULT '',
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  previous_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  new_cost NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  client TEXT NOT NULL,
  client_id TEXT,
  quote_date DATE NOT NULL,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'none',
  discount_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  items INTEGER NOT NULL DEFAULT 0,
  payment TEXT DEFAULT 'Pix',
  payment_terms TEXT DEFAULT '',
  condition TEXT DEFAULT 'full',
  due_date DATE,
  status TEXT DEFAULT 'Ativo'
);

CREATE TABLE IF NOT EXISTS quote_lines (
  quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL,
  product_id TEXT,
  product TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  size TEXT DEFAULT '',
  color TEXT DEFAULT '',
  category TEXT DEFAULT '',
  PRIMARY KEY (quote_id, line_no)
);

CREATE TABLE IF NOT EXISTS app_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO app_meta (id, revision) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON sales(client_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(quote_date);
