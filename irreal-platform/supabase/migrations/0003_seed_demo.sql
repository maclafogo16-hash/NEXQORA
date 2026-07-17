-- ============================================================
-- Datos de ejemplo — un restaurante demo para probar el flujo completo
-- (Motor Web + Motor de Pedidos) antes de conectar el primer cliente real.
-- ============================================================

insert into organizations (id, name, slug, primary_color, plan)
values ('00000000-0000-0000-0000-000000000001', 'Restaurante Demo IRREAL', 'demo', '#16233B', 'esencial');

insert into branches (organization_id, name, address, is_main)
values ('00000000-0000-0000-0000-000000000001', 'Sede Principal', 'Cra 27 # 45-10, Bucaramanga', true);

insert into categories (id, organization_id, name, sort_order) values
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Entradas', 1),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Fuertes', 2),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Bebidas', 3);

insert into products (organization_id, category_id, name, description, price, sort_order) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000010', 'Patacones con hogao', 'Patacones crocantes con hogao casero', 14000, 1),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Mamona santandereana', 'Carne de res a la brasa con yuca y arepa', 32000, 1),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', 'Cabrito con pepitoria', 'Plato típico santandereano', 35000, 2),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', 'Limonada de coco', 'Limonada natural con coco', 8000, 1);
