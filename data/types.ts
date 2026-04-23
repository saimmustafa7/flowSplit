export interface Profile {
  id: string
  name: string
  email: string
  created_at: string
}

export interface Group {
  id: string
  name: string
  emoji: string
  join_code?: string
  created_by: string
  created_at: string
  members?: Profile[]
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  joined_at: string
  profile?: Profile
}

export interface GroupInvite {
  id: string
  group_id: string
  invited_by: string
  invited_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  group?: Pick<Group, 'id' | 'name' | 'emoji'>
  inviter?: Pick<Profile, 'name' | 'email'>
}

export interface Transaction {
  id: string
  group_id: string
  title: string
  total_amount: number       // paisa
  paid_by: string            // profile id
  category: Category
  transaction_date: string
  split_mode?: SplitMode
  note?: string
  created_at: string
  splits?: Split[]
  payer?: Pick<Profile, 'id' | 'name'>
}

export interface Split {
  id: string
  transaction_id: string
  user_id: string
  amount: number             // paisa — this person's share
}

export interface Adjustment {
  id: string
  group_id: string
  from_user_id: string       // who owes
  to_user_id: string         // who is owed
  amount: number             // paisa, positive = from owes to
  note?: string
  created_by: string
  created_at: string
}

export type ManualAdjustment = Adjustment

export interface Settlement {
  id: string
  group_id: string
  payer_id: string           // who paid
  receiver_id: string        // who received
  amount: number             // paisa
  created_at: string
}

export interface SoloExpense {
  id: string
  user_id: string
  title: string
  amount: number             // paisa
  category: Category
  expense_date: string
  note?: string
  created_at: string
}

export interface MemberBalance {
  userId: string
  name: string
  netBalance: number         // negative = owed, positive = owes
}

export interface MinimalPayment {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

export type Category =
  | 'food' | 'transport' | 'entertainment'
  | 'health' | 'shopping' | 'travel'
  | 'utilities' | 'rent' | 'other'

export type SplitMode = 'equal' | 'exact' | 'shares' | 'percentage' | 'mine'
export type SplitType = SplitMode

export interface AppState {
  groups: Group[]
  transactions: Transaction[]
  adjustments: ManualAdjustment[]
  soloExpenses: SoloExpense[]
}
