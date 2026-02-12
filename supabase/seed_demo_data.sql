-- ============================================
-- DEMO SEED DATA — QR Asset Scanner
-- Run this in Supabase SQL Editor after all migrations.
-- Creates realistic laydown yard demo data.
-- ============================================

-- NOTE: You must create auth users manually in Supabase Auth dashboard first,
-- then insert matching rows here with the correct UUIDs.
-- Replace the UUIDs below with your actual auth user IDs.

-- ============================================
-- 1. LOCATIONS — typical yard layout
-- ============================================
insert into public.locations (zone, row, rack, capacity, is_hold_area) values
  ('A', '1', '1', 50, false),
  ('A', '1', '2', 50, false),
  ('A', '1', '3', 50, false),
  ('A', '2', '1', 50, false),
  ('A', '2', '2', 50, false),
  ('B', '1', '1', 30, false),
  ('B', '1', '2', 30, false),
  ('B', '2', '1', 30, false),
  ('C', '1', '1', 20, false),
  ('C', '1', '2', 20, false),
  ('HOLD', '1', '1', 10, true),
  ('HOLD', '1', '2', 10, true);

-- ============================================
-- 2. QR CODES — pre-generated labels
-- ============================================
insert into public.qr_codes (code_value, entity_type) values
  ('QR-A1B2C3D4', 'item'),
  ('QR-E5F6G7H8', 'item'),
  ('QR-I9J0K1L2', 'item'),
  ('QR-M3N4O5P6', 'item'),
  ('QR-Q7R8S9T0', 'item'),
  ('QR-U1V2W3X4', 'item'),
  ('QR-Y5Z6A7B8', 'item'),
  ('QR-C9D0E1F2', 'item'),
  ('QR-G3H4I5J6', 'item'),
  ('QR-K7L8M9N0', 'item'),
  -- Unlinked (available for future use)
  ('QR-AVAIL001', 'item'),
  ('QR-AVAIL002', 'item'),
  ('QR-AVAIL003', 'item'),
  ('QR-AVAIL004', 'item'),
  ('QR-AVAIL005', 'item');

-- ============================================
-- 3. RECEIVING RECORDS
-- Use a CTE to get location IDs and QR IDs dynamically
-- ============================================

-- We need to reference the IDs we just created.
-- First, create receiving records referencing the QR codes and locations.

do $$
declare
  loc_a1_1 uuid;
  loc_a1_2 uuid;
  loc_a2_1 uuid;
  loc_b1_1 uuid;
  loc_b1_2 uuid;
  loc_c1_1 uuid;
  loc_hold  uuid;
  qr1 uuid; qr2 uuid; qr3 uuid; qr4 uuid; qr5 uuid;
  qr6 uuid; qr7 uuid; qr8 uuid; qr9 uuid; qr10 uuid;
  rec1 uuid; rec2 uuid; rec3 uuid; rec4 uuid; rec5 uuid;
  rec6 uuid; rec7 uuid; rec8 uuid; rec9 uuid; rec10 uuid;
  demo_user uuid;
begin
  -- Get location IDs
  select id into loc_a1_1 from locations where zone='A' and row='1' and rack='1';
  select id into loc_a1_2 from locations where zone='A' and row='1' and rack='2';
  select id into loc_a2_1 from locations where zone='A' and row='2' and rack='1';
  select id into loc_b1_1 from locations where zone='B' and row='1' and rack='1';
  select id into loc_b1_2 from locations where zone='B' and row='1' and rack='2';
  select id into loc_c1_1 from locations where zone='C' and row='1' and rack='1';
  select id into loc_hold  from locations where zone='HOLD' and row='1' and rack='1';

  -- Get QR code IDs
  select id into qr1  from qr_codes where code_value='QR-A1B2C3D4';
  select id into qr2  from qr_codes where code_value='QR-E5F6G7H8';
  select id into qr3  from qr_codes where code_value='QR-I9J0K1L2';
  select id into qr4  from qr_codes where code_value='QR-M3N4O5P6';
  select id into qr5  from qr_codes where code_value='QR-Q7R8S9T0';
  select id into qr6  from qr_codes where code_value='QR-U1V2W3X4';
  select id into qr7  from qr_codes where code_value='QR-Y5Z6A7B8';
  select id into qr8  from qr_codes where code_value='QR-C9D0E1F2';
  select id into qr9  from qr_codes where code_value='QR-G3H4I5J6';
  select id into qr10 from qr_codes where code_value='QR-K7L8M9N0';

  -- Get any existing user as demo_user (first user found)
  select id into demo_user from users limit 1;

  -- If no user exists, skip the rest
  if demo_user is null then
    raise notice 'No users found — create at least one user first, then re-run.';
    return;
  end if;

  -- ============================================
  -- RECEIVING RECORDS (10 items, mix of statuses)
  -- ============================================

  -- 1. Steel Pipe — accepted, 60 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr1, 'accepted', 'Steel Pipe', '6 inch', 'A106-B', 100, 5200, 'US Steel Supply', 'PO-2024-001', 'FedEx Freight', 'good', true, false, loc_a1_1, demo_user, now() - interval '60 days')
  returning id into rec1;

  -- 2. Steel Plate — accepted, 45 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr2, 'accepted', 'Steel Plate', '1/2 inch', 'A516-70', 50, 12000, 'Metro Metals', 'PO-2024-002', 'XPO Logistics', 'good', true, false, loc_a1_2, demo_user, now() - interval '45 days')
  returning id into rec2;

  -- 3. Flanges — accepted, 30 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr3, 'accepted', 'Flanges', '8 inch 150#', 'A105', 200, 3400, 'Boltex Manufacturing', 'PO-2024-003', 'Estes Express', 'good', true, false, loc_a2_1, demo_user, now() - interval '30 days')
  returning id into rec3;

  -- 4. Valves — accepted, 20 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr4, 'accepted', 'Valves', '4 inch Gate', 'A216-WCB', 30, 900, 'ValvTechnologies', 'PO-2024-004', 'Old Dominion', 'good', true, false, loc_b1_1, demo_user, now() - interval '20 days')
  returning id into rec4;

  -- 5. Fittings — partially accepted (damage exception), 15 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, damage_notes, inspection_pass, has_exception, exception_type, location_id, created_by, created_at)
  values (qr5, 'partially_accepted', 'Fittings', '6 inch Elbow', 'A234-WPB', 80, 1600, 'Anvil International', 'PO-2024-005', 'R+L Carriers', 'damaged', '12 elbows have visible cracks on weld seams, separated to hold area', false, true, 'damage', loc_hold, demo_user, now() - interval '15 days')
  returning id into rec5;

  -- 6. Steel Pipe — accepted, 10 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr6, 'accepted', 'Steel Pipe', '4 inch', 'A106-B', 150, 4500, 'US Steel Supply', 'PO-2024-006', 'FedEx Freight', 'good', true, false, loc_b1_2, demo_user, now() - interval '10 days')
  returning id into rec6;

  -- 7. Bolts/Studs — accepted, 7 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr7, 'accepted', 'Bolts/Studs', '3/4 x 4-1/2', 'B7/2H', 500, 800, 'Portland Bolt', 'PO-2024-007', 'UPS Freight', 'good', true, false, loc_c1_1, demo_user, now() - interval '7 days')
  returning id into rec7;

  -- 8. Gaskets — wrong count exception (unresolved), 5 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, damage_notes, inspection_pass, has_exception, exception_type, location_id, created_by, created_at)
  values (qr8, 'partially_accepted', 'Gaskets', '8 inch Spiral Wound', 'SS316', 100, 120, 'Flexitallic', 'PO-2024-008', 'FedEx Ground', 'good', 'PO says 150, only 100 received. Carrier docs match 100.', true, true, 'wrong_count', loc_c1_1, demo_user, now() - interval '5 days')
  returning id into rec8;

  -- 9. Steel Plate — accepted, 3 days ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, inspection_pass, has_exception, location_id, created_by, created_at)
  values (qr9, 'accepted', 'Steel Plate', '3/4 inch', 'A516-70', 25, 8500, 'Metro Metals', 'PO-2024-009', 'XPO Logistics', 'good', true, false, loc_a1_1, demo_user, now() - interval '3 days')
  returning id into rec9;

  -- 10. Wrong type exception (unresolved), 1 day ago
  insert into receiving_records (qr_code_id, status, material_type, size, grade, qty, weight, vendor, po_number, carrier, condition, damage_notes, inspection_pass, has_exception, exception_type, location_id, created_by, created_at)
  values (qr10, 'rejected', 'Steel Pipe', '8 inch', 'A106-B', 40, 2800, 'Gulf Pipe Supply', 'PO-2024-010', 'Saia LTL', 'good', 'Ordered 8 inch A333-6, received A106-B instead. Wrong spec for low-temp service.', true, true, 'wrong_type', loc_hold, demo_user, now() - interval '1 day')
  returning id into rec10;

  -- Resolve one exception (the damage one from 15 days ago)
  update receiving_records set exception_resolved = true, exception_resolution = 'hold' where id = rec5;

  -- ============================================
  -- MATERIALS (created from accepted receiving records)
  -- ============================================

  -- 1. Steel Pipe 6" — some issued
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec1, qr1, 'Steel Pipe', '6 inch', 'A106-B', 100, 72, 5200, loc_a1_1, 'in_yard', now() - interval '60 days');

  -- 2. Steel Plate 1/2" — all still in yard
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec2, qr2, 'Steel Plate', '1/2 inch', 'A516-70', 50, 50, 12000, loc_a1_2, 'in_yard', now() - interval '45 days');

  -- 3. Flanges — some shipped
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec3, qr3, 'Flanges', '8 inch 150#', 'A105', 200, 140, 3400, loc_a2_1, 'in_yard', now() - interval '30 days');

  -- 4. Valves — in yard
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec4, qr4, 'Valves', '4 inch Gate', 'A216-WCB', 30, 30, 900, loc_b1_1, 'in_yard', now() - interval '20 days');

  -- 5. Fittings — in hold area (damaged)
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec5, qr5, 'Fittings', '6 inch Elbow', 'A234-WPB', 80, 80, 1600, loc_hold, 'in_yard', now() - interval '15 days');

  -- 6. Steel Pipe 4" — in yard
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec6, qr6, 'Steel Pipe', '4 inch', 'A106-B', 150, 150, 4500, loc_b1_2, 'in_yard', now() - interval '10 days');

  -- 7. Bolts — some issued
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec7, qr7, 'Bolts/Studs', '3/4 x 4-1/2', 'B7/2H', 500, 350, 800, loc_c1_1, 'in_yard', now() - interval '7 days');

  -- 8. Gaskets — in yard
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec8, qr8, 'Gaskets', '8 inch Spiral Wound', 'SS316', 100, 100, 120, loc_c1_1, 'in_yard', now() - interval '5 days');

  -- 9. Steel Plate 3/4" — in yard
  insert into materials (receiving_record_id, qr_code_id, material_type, size, grade, qty, current_quantity, weight, location_id, status, created_at)
  values (rec9, qr9, 'Steel Plate', '3/4 inch', 'A516-70', 25, 25, 8500, loc_a1_1, 'in_yard', now() - interval '3 days');

  -- ============================================
  -- MATERIAL MOVEMENTS (transfer history)
  -- ============================================

  -- Fittings moved to hold area after damage found
  insert into material_movements (material_id, from_location_id, to_location_id, moved_by, reason, created_at)
  select m.id, loc_b1_1, loc_hold, demo_user, 'Damaged items separated to hold area for inspection', now() - interval '14 days'
  from materials m where m.qr_code_id = qr5;

  -- ============================================
  -- MATERIAL ISSUES (issued to jobs)
  -- ============================================

  -- Steel Pipe 6" — 28 issued to Job 1001
  insert into material_issues (material_id, job_number, work_order, quantity_issued, issued_by, created_at)
  select m.id, 'JOB-1001', 'WO-5501', 28, demo_user, now() - interval '25 days'
  from materials m where m.qr_code_id = qr1;

  -- Bolts — 150 issued to Job 1002
  insert into material_issues (material_id, job_number, work_order, quantity_issued, issued_by, created_at)
  select m.id, 'JOB-1002', 'WO-5510', 150, demo_user, now() - interval '3 days'
  from materials m where m.qr_code_id = qr7;

  -- ============================================
  -- SHIPMENTS OUT
  -- ============================================

  -- Flanges — 60 shipped to satellite site
  insert into shipments_out (material_id, destination, carrier, tracking_number, quantity_shipped, created_at)
  select m.id, 'Satellite Yard - Houston East', 'FedEx Freight', 'FX-7789001234', 60, now() - interval '12 days'
  from materials m where m.qr_code_id = qr3;

  -- Link QR codes to their entity (material)
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr1) where id = qr1;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr2) where id = qr2;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr3) where id = qr3;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr4) where id = qr4;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr5) where id = qr5;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr6) where id = qr6;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr7) where id = qr7;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr8) where id = qr8;
  update qr_codes set entity_id = (select m.id from materials m where m.qr_code_id = qr9) where id = qr9;

  -- ============================================
  -- AUDIT LOG entries
  -- ============================================
  insert into audit_log (user_id, action, entity_type, details, created_at) values
    (demo_user, 'receiving_created', 'receiving_record', '{"material_type":"Steel Pipe","qty":100}', now() - interval '60 days'),
    (demo_user, 'receiving_created', 'receiving_record', '{"material_type":"Steel Plate","qty":50}', now() - interval '45 days'),
    (demo_user, 'receiving_created', 'receiving_record', '{"material_type":"Flanges","qty":200}', now() - interval '30 days'),
    (demo_user, 'material_issued', 'material', '{"job_number":"JOB-1001","quantity":28}', now() - interval '25 days'),
    (demo_user, 'material_transferred', 'material', '{"reason":"Damaged items to hold"}', now() - interval '14 days'),
    (demo_user, 'shipment_created', 'material', '{"destination":"Houston East","quantity":60}', now() - interval '12 days'),
    (demo_user, 'exception_resolved', 'receiving_record', '{"resolution":"hold"}', now() - interval '13 days'),
    (demo_user, 'material_issued', 'material', '{"job_number":"JOB-1002","quantity":150}', now() - interval '3 days');

  raise notice 'Demo data seeded successfully!';
end $$;
