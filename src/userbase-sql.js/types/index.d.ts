// Expose as userbaseSqlJs when loaded in an IIFE environment
export as namespace userbaseSqlJs

export type UpdateUserHandler = (updatedUser: { user: UserResult }) => void

export interface Session {
  user?: UserResult
  lastUsedUsername?: string
}

export interface UserProfile {
  [key: string]: string
}

export type RememberMeOption = 'session' | 'local' | 'none'

export type PaymentsMode = 'disabled' | 'test' | 'prod'

export type SubscriptionStatus = 'active' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'canceled' | 'unpaid'

export interface UserResult {
  username: string
  userId: string
  authToken: string
  creationDate: Date
  paymentsMode: PaymentsMode
  trialExpirationDate?: Date
  subscriptionStatus?: SubscriptionStatus
  cancelSubscriptionAt?: Date
  email?: string
  profile?: UserProfile
  protectedProfile?: UserProfile
  usedTempPassword?: boolean
  passwordChanged?: boolean
}

export type DatabaseChangeHandler = (items: Item[]) => void

// https://sql.js.org/documentation/Database.html
export type SqlJsDatabaseChangeHandler = (sqlJsDatabase: { db: any }) => void

export interface DatabasesResult {
  databases: Database[]
}

export interface Database {
  databaseName: string
  databaseId: string
  isOwner: boolean
  receivedFromUsername?: string
  readOnly: boolean
  resharingAllowed: boolean
  users: DatabaseUsers[]
}

export interface DatabaseUsers {
  username: string
  isOwner: boolean
  receivedFromUsername?: string
  readOnly: boolean
  resharingAllowed: boolean
  verified?: boolean
}

// https://sql.js.org/documentation/Statement.html#%5B%22bind%22%5D
export type BindValues = string[] | {}

export interface SqlStatement {
  sql: string,
  bindValues?: BindValues
}

export type DatabaseOperation = InsertOperation | UpdateOperation | DeleteOperation

export interface InsertOperation {
  command: 'Insert'
  itemId?: string
  item: any
}

export interface UpdateOperation {
  command: 'Update'
  itemId: string
  item: any
}

export interface DeleteOperation {
  command: 'Delete'
  itemId: string
}

export interface Item {
  itemId: string
  item: any
  createdBy: Attribution
  updatedBy?: Attribution
  fileId?: string
  fileName?: string
  fileSize?: number
  fileUploadedBy?: Attribution
}

export interface Attribution {
  timestamp: Date
  username?: string
  userDeleted?: boolean
}

export interface FileResult {
  file: File
}

export type FileUploadProgressHandler = (uploadProgress: { bytesTransferred: number }) => void

export interface CancelSubscriptionResult {
  cancelSubscriptionAt: Date
}

export interface UserbaseSqlJs {
  init(params: { appId: string, updateUserHandler?: UpdateUserHandler, sessionLength?: number }): Promise<Session>

  signUp(params: { username: string, password: string, email?: string, profile?: UserProfile, rememberMe?: RememberMeOption, sessionLength?: number }): Promise<UserResult>

  signIn(params: { username: string, password: string, rememberMe?: RememberMeOption, sessionLength?: number }): Promise<UserResult>

  signOut(): Promise<void>

  updateUser(params: { username?: string, currentPassword?: string, newPassword?: string, email?: string | null, profile?: UserProfile | null }): Promise<void>

  deleteUser(): Promise<void>

  forgotPassword(params: { username: string }): Promise<void>

  openDatabase(params: { databaseName?: string, databaseId?: string, changeHandler: DatabaseChangeHandler }): Promise<void>

  openSqlJsDatabase(params: { databaseName: string, changeHandler: SqlJsDatabaseChangeHandler }): Promise<void>

  execSql(params: { databaseName: string, sql?: string, bindValues?: BindValues, sqlStatements?: SqlStatement[] }): Promise<void>

  getDatabases(params?: { databaseName?: string, databaseId?: string }): Promise<DatabasesResult>

  insertItem(params: { databaseName?: string, databaseId?: string, item: any, itemId?: string }): Promise<void>

  updateItem(params: { databaseName?: string, databaseId?: string, item: any, itemId: string }): Promise<void>

  deleteItem(params: { databaseName?: string, databaseId?: string, itemId: string }): Promise<void>

  putTransaction(params: { databaseName?: string, databaseId?: string, operations: DatabaseOperation[] }): Promise<void>

  uploadFile(params: { databaseName?: string, databaseId?: string, itemId: string, file: File, progressHandler?: FileUploadProgressHandler }): Promise<void>

  getFile(params: { databaseName?: string, databaseId?: string, fileId: string, range?: { start: number, end: number } }): Promise<FileResult>

  getVerificationMessage(): Promise<{ verificationMessage: string }>

  verifyUser(params: { verificationMessage: string }): Promise<void>

  shareDatabase(params: { databaseName?: string, databaseId?: string, username: string, requireVerified?: boolean, readOnly?: boolean, resharingAllowed?: boolean }): Promise<void>

  modifyDatabasePermissions(params: { databaseName?: string, databaseId?: string, username: string, readOnly?: boolean, resharingAllowed?: boolean, revoke?: boolean }): Promise<void>

  purchaseSubscription(params: { successUrl: string, cancelUrl: string }): Promise<void>

  cancelSubscription(): Promise<CancelSubscriptionResult>

  resumeSubscription(): Promise<void>

  updatePaymentMethod(params: { successUrl: string, cancelUrl: string }): Promise<void>
}

declare let userbaseSqlJs: UserbaseSqlJs

export default userbaseSqlJs
