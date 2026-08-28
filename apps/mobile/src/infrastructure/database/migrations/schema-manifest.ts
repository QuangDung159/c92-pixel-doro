export const INITIAL_SCHEMA_VERSION = 1;
export const INITIAL_SCHEMA_NAME = 'initial-schema';

export const INITIAL_SCHEMA_TABLES = [
  'analytics_events',
  'app_installation',
  'app_settings',
  'catalog_items',
  'owned_items',
  'pet_profiles',
  'purchase_transactions',
  'reward_transactions',
  'schema_migrations',
  'sessions',
  'store_review_attempts',
] as const;

export type InitialSchemaTableName = (typeof INITIAL_SCHEMA_TABLES)[number];

export interface InitialSchemaColumnManifest {
  readonly name: string;
  readonly type: 'INTEGER' | 'TEXT';
  readonly notNull: boolean;
  readonly defaultValue: string | null;
  readonly primaryKeyPosition: number;
}

const column = (
  name: string,
  type: InitialSchemaColumnManifest['type'],
  options: {
    readonly nullable?: boolean;
    readonly defaultValue?: string;
    readonly primaryKeyPosition?: number;
  } = {},
): InitialSchemaColumnManifest => ({
  name,
  type,
  notNull: options.nullable !== true,
  defaultValue: options.defaultValue ?? null,
  primaryKeyPosition: options.primaryKeyPosition ?? 0,
});

export const INITIAL_SCHEMA_COLUMN_MANIFEST = {
  analytics_events: [
    column('event_id', 'TEXT', { primaryKeyPosition: 1 }),
    column('event_name', 'TEXT'),
    column('properties_json', 'TEXT', { defaultValue: "'{}'" }),
    column('occurred_at', 'INTEGER'),
    column('expires_at', 'INTEGER'),
    column('delivery_state', 'TEXT', { defaultValue: "'pending'" }),
    column('attempt_count', 'INTEGER', { defaultValue: '0' }),
    column('next_attempt_at', 'INTEGER', { nullable: true }),
    column('created_at', 'INTEGER'),
  ],
  app_installation: [
    column('id', 'INTEGER', { defaultValue: '1', primaryKeyPosition: 1 }),
    column('installed_at', 'INTEGER'),
    column('onboarding_completed_at', 'INTEGER', { nullable: true }),
    column('anonymous_analytics_id', 'TEXT', { nullable: true }),
    column('created_at', 'INTEGER'),
    column('updated_at', 'INTEGER'),
  ],
  app_settings: [
    column('id', 'INTEGER', { defaultValue: '1', primaryKeyPosition: 1 }),
    column('focus_duration_minutes', 'INTEGER', { defaultValue: '25' }),
    column('short_break_minutes', 'INTEGER', { defaultValue: '5' }),
    column('long_break_minutes', 'INTEGER', { defaultValue: '15' }),
    column('default_mode', 'TEXT', { defaultValue: "'relax'" }),
    column('sound_enabled', 'INTEGER', { defaultValue: '1' }),
    column('haptics_enabled', 'INTEGER', { defaultValue: '1' }),
    column('notifications_enabled', 'INTEGER', { defaultValue: '1' }),
    column('analytics_enabled', 'INTEGER', { defaultValue: '1' }),
    column('created_at', 'INTEGER'),
    column('updated_at', 'INTEGER'),
  ],
  catalog_items: [
    column('id', 'TEXT', { primaryKeyPosition: 1 }),
    column('display_name', 'TEXT'),
    column('category', 'TEXT', { defaultValue: "'furniture'" }),
    column('price_coins', 'INTEGER'),
    column('catalog_version', 'INTEGER', { defaultValue: '1' }),
    column('created_at', 'INTEGER'),
    column('updated_at', 'INTEGER'),
  ],
  owned_items: [
    column('profile_id', 'INTEGER', { defaultValue: '1', primaryKeyPosition: 1 }),
    column('item_id', 'TEXT', { primaryKeyPosition: 2 }),
    column('purchase_transaction_id', 'TEXT'),
    column('unlocked_at', 'INTEGER'),
    column('is_equipped', 'INTEGER', { defaultValue: '0' }),
    column('equipped_at', 'INTEGER', { nullable: true }),
    column('updated_at', 'INTEGER'),
  ],
  pet_profiles: [
    column('id', 'INTEGER', { defaultValue: '1', primaryKeyPosition: 1 }),
    column('total_xp', 'INTEGER', { defaultValue: '0' }),
    column('coin_balance', 'INTEGER', { defaultValue: '0' }),
    column('created_at', 'INTEGER'),
    column('updated_at', 'INTEGER'),
  ],
  purchase_transactions: [
    column('id', 'TEXT', { primaryKeyPosition: 1 }),
    column('profile_id', 'INTEGER', { defaultValue: '1' }),
    column('item_id', 'TEXT'),
    column('price_paid_coins', 'INTEGER'),
    column('coin_delta', 'INTEGER'),
    column('reason', 'TEXT', { defaultValue: "'item_purchase'" }),
    column('created_at', 'INTEGER'),
  ],
  reward_transactions: [
    column('id', 'TEXT', { primaryKeyPosition: 1 }),
    column('session_id', 'TEXT'),
    column('profile_id', 'INTEGER', { defaultValue: '1' }),
    column('xp_delta', 'INTEGER'),
    column('coin_delta', 'INTEGER'),
    column('reason', 'TEXT'),
    column('created_at', 'INTEGER'),
  ],
  schema_migrations: [
    column('version', 'INTEGER', { primaryKeyPosition: 1 }),
    column('name', 'TEXT'),
    column('checksum', 'TEXT'),
    column('applied_at', 'INTEGER'),
  ],
  sessions: [
    column('id', 'TEXT', { primaryKeyPosition: 1 }),
    column('profile_id', 'INTEGER', { defaultValue: '1' }),
    column('session_type', 'TEXT'),
    column('focus_variant', 'TEXT', { nullable: true }),
    column('mode', 'TEXT', { nullable: true }),
    column('status', 'TEXT', { defaultValue: "'running'" }),
    column('work_tag', 'TEXT', { nullable: true }),
    column('configured_duration_minutes', 'INTEGER'),
    column('started_at', 'INTEGER'),
    column('ends_at', 'INTEGER'),
    column('backgrounded_at', 'INTEGER', { nullable: true }),
    column('resolved_at', 'INTEGER', { nullable: true }),
    column('xp_earned', 'INTEGER', { defaultValue: '0' }),
    column('coins_earned', 'INTEGER', { defaultValue: '0' }),
    column('reward_claimed_at', 'INTEGER', { nullable: true }),
    column('scheduled_end_local_date', 'TEXT'),
    column('scheduled_end_utc_offset_minutes', 'INTEGER'),
    column('created_at', 'INTEGER'),
    column('updated_at', 'INTEGER'),
  ],
  store_review_attempts: [
    column('id', 'TEXT', { primaryKeyPosition: 1 }),
    column('app_version', 'TEXT'),
    column('attempted_at', 'INTEGER'),
    column('created_at', 'INTEGER'),
  ],
} as const satisfies Record<
  InitialSchemaTableName,
  readonly InitialSchemaColumnManifest[]
>;

export interface InitialSchemaForeignKeyManifest {
  readonly table: InitialSchemaTableName;
  readonly from: string;
  readonly targetTable: InitialSchemaTableName;
  readonly targetColumn: string;
}

export const INITIAL_SCHEMA_FOREIGN_KEYS = [
  { table: 'sessions', from: 'profile_id', targetTable: 'pet_profiles', targetColumn: 'id' },
  { table: 'reward_transactions', from: 'profile_id', targetTable: 'pet_profiles', targetColumn: 'id' },
  { table: 'reward_transactions', from: 'session_id', targetTable: 'sessions', targetColumn: 'id' },
  { table: 'reward_transactions', from: 'profile_id', targetTable: 'sessions', targetColumn: 'profile_id' },
  { table: 'purchase_transactions', from: 'profile_id', targetTable: 'pet_profiles', targetColumn: 'id' },
  { table: 'purchase_transactions', from: 'item_id', targetTable: 'catalog_items', targetColumn: 'id' },
  { table: 'owned_items', from: 'profile_id', targetTable: 'pet_profiles', targetColumn: 'id' },
  { table: 'owned_items', from: 'item_id', targetTable: 'catalog_items', targetColumn: 'id' },
  { table: 'owned_items', from: 'purchase_transaction_id', targetTable: 'purchase_transactions', targetColumn: 'id' },
  { table: 'owned_items', from: 'profile_id', targetTable: 'purchase_transactions', targetColumn: 'profile_id' },
  { table: 'owned_items', from: 'item_id', targetTable: 'purchase_transactions', targetColumn: 'item_id' },
] as const satisfies readonly InitialSchemaForeignKeyManifest[];

export interface InitialSchemaIndexManifest {
  readonly name: string;
  readonly table: InitialSchemaTableName;
  readonly unique: boolean;
  readonly columns: readonly string[];
  readonly descending?: readonly string[];
  readonly where?: string;
}

export const INITIAL_SCHEMA_INDEXES: readonly InitialSchemaIndexManifest[] = [
  {
    name: 'ux_sessions_one_running',
    table: 'sessions',
    unique: true,
    columns: ['status'],
    where: "status = 'running'",
  },
  {
    name: 'ix_sessions_history',
    table: 'sessions',
    unique: false,
    columns: [
      'profile_id',
      'session_type',
      'focus_variant',
      'status',
      'ends_at',
    ],
    descending: ['ends_at'],
  },
  {
    name: 'ix_sessions_local_day',
    table: 'sessions',
    unique: false,
    columns: [
      'profile_id',
      'scheduled_end_local_date',
      'session_type',
      'focus_variant',
      'status',
    ],
  },
  {
    name: 'ix_sessions_recent',
    table: 'sessions',
    unique: false,
    columns: ['profile_id', 'started_at'],
    descending: ['started_at'],
  },
  {
    name: 'ix_sessions_long_break_cadence',
    table: 'sessions',
    unique: false,
    columns: ['profile_id', 'session_type', 'status', 'resolved_at'],
    descending: ['resolved_at'],
  },
  {
    name: 'ix_sessions_strict_active',
    table: 'sessions',
    unique: false,
    columns: ['backgrounded_at'],
    where: "status = 'running' AND mode = 'strict'",
  },
  {
    name: 'ux_reward_transactions_session',
    table: 'reward_transactions',
    unique: true,
    columns: ['session_id'],
  },
  {
    name: 'ix_reward_transactions_profile_time',
    table: 'reward_transactions',
    unique: false,
    columns: ['profile_id', 'created_at'],
    descending: ['created_at'],
  },
  {
    name: 'ix_catalog_items_category_price',
    table: 'catalog_items',
    unique: false,
    columns: ['category', 'price_coins', 'id'],
  },
  {
    name: 'ux_purchase_profile_item',
    table: 'purchase_transactions',
    unique: true,
    columns: ['profile_id', 'item_id'],
  },
  {
    name: 'ix_owned_items_equipped',
    table: 'owned_items',
    unique: false,
    columns: ['profile_id', 'is_equipped', 'updated_at'],
    descending: ['updated_at'],
  },
  {
    name: 'ix_store_review_attempt_time',
    table: 'store_review_attempts',
    unique: false,
    columns: ['attempted_at'],
    descending: ['attempted_at'],
  },
  {
    name: 'ix_analytics_delivery',
    table: 'analytics_events',
    unique: false,
    columns: ['delivery_state', 'next_attempt_at', 'occurred_at'],
  },
  {
    name: 'ix_analytics_expiry',
    table: 'analytics_events',
    unique: false,
    columns: ['expires_at'],
  },
] as const;

export const INITIAL_SCHEMA_TRIGGERS = [
  'trg_owned_item_equip_consistency',
  'trg_purchase_immutable',
  'trg_reward_immutable',
  'trg_reward_insert_valid_session',
  'trg_sessions_identity_immutable',
  'trg_sessions_terminal_immutable',
] as const;

export interface CatalogSeedItem {
  readonly id: string;
  readonly displayName: string;
  readonly category: 'furniture';
  readonly priceCoins: number;
}

export const INITIAL_CATALOG_SEED = [
  { id: 'desk-mug', displayName: 'Cốc trên bàn', category: 'furniture', priceCoins: 5 },
  { id: 'tiny-plant', displayName: 'Chậu cây nhỏ', category: 'furniture', priceCoins: 10 },
  { id: 'book-stack', displayName: 'Chồng sách', category: 'furniture', priceCoins: 15 },
  { id: 'desk-lamp', displayName: 'Đèn bàn', category: 'furniture', priceCoins: 20 },
  { id: 'wall-calendar', displayName: 'Lịch treo tường', category: 'furniture', priceCoins: 25 },
  { id: 'floor-cushion', displayName: 'Đệm ngồi', category: 'furniture', priceCoins: 30 },
  { id: 'small-rug', displayName: 'Thảm nhỏ', category: 'furniture', priceCoins: 40 },
  { id: 'wall-poster', displayName: 'Tranh treo tường', category: 'furniture', priceCoins: 50 },
  { id: 'bookshelf', displayName: 'Kệ sách', category: 'furniture', priceCoins: 60 },
  { id: 'standing-lamp', displayName: 'Đèn đứng', category: 'furniture', priceCoins: 75 },
  { id: 'armchair', displayName: 'Ghế bành', category: 'furniture', priceCoins: 90 },
  { id: 'window-view', displayName: 'Khung cửa sổ', category: 'furniture', priceCoins: 120 },
] as const satisfies readonly CatalogSeedItem[];
