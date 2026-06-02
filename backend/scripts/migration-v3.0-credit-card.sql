-- ============================================================
-- FIRE 生活家 v3.0 数据库迁移
-- 为 accounts 表新增信用卡、灵活还款相关字段
-- 数据库: PostgreSQL (firelifes schema)
-- 日期: 2026-06-01
-- ============================================================

-- 1. 新增灵活还款追踪字段
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS last_repayment_date TIMESTAMP NULL;

COMMENT ON COLUMN firelifes.accounts.last_repayment_date IS '上次还款日期（灵活还款用）';

-- 2. 新增信用卡账单日
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS billing_day INT NULL;

COMMENT ON COLUMN firelifes.accounts.billing_day IS '账单日 1-28';

-- 3. 新增信用卡还款日
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS due_day INT NULL;

COMMENT ON COLUMN firelifes.accounts.due_day IS '还款日 1-28';

-- 4. 新增信用卡额度
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(14, 2) NULL;

COMMENT ON COLUMN firelifes.accounts.credit_limit IS '信用额度';

-- 5. 新增最低还款比例
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS min_payment_rate DECIMAL(5, 2) NULL DEFAULT 10;

COMMENT ON COLUMN firelifes.accounts.min_payment_rate IS '最低还款比例，默认10%';

-- 6. 新增逾期日利率
ALTER TABLE firelifes.accounts
  ADD COLUMN IF NOT EXISTS daily_interest_rate DECIMAL(5, 2) NULL DEFAULT 0.05;

COMMENT ON COLUMN firelifes.accounts.daily_interest_rate IS '逾期日利率，默认万分之五';

-- ============================================================
-- 注意事项:
-- 1. type 字段的 credit_card 枚举值需要在应用层面约束，PostgreSQL 使用 varchar 存储
-- 2. repayment_method 已支持 flexible 值（可在应用层直接使用）
-- 3. TypeORM synchronize: true 会在应用启动时自动执行上述 DDL，
--    本迁移文件供手动执行或生产环境数据库变更审计使用
-- ============================================================
