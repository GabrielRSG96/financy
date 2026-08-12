const USER_FIELDS = `
  fragment UserFields on User { id name email initials avatarUrl }
`

const CATEGORY_FIELDS = `
  fragment CategoryFields on Category {
    id
    title
    description
    icon
    color
    transactionCount
    incomeCents
    expenseCents
    balanceCents
  }
`

const TRANSACTION_FIELDS = `
  fragment TransactionFields on Transaction {
    id
    description
    amountCents
    date
    type
    category { id title icon color }
  }
`

export const ME = `
  ${USER_FIELDS}
  query Me { me { ...UserFields } }
`

export const SIGN_IN = `
  ${USER_FIELDS}
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) { token user { ...UserFields } }
  }
`

export const SIGN_UP = `
  ${USER_FIELDS}
  mutation SignUp($name: String!, $email: String!, $password: String!) {
    signUp(name: $name, email: $email, password: $password) { token user { ...UserFields } }
  }
`

export const UPDATE_PROFILE = `
  ${USER_FIELDS}
  mutation UpdateProfile($name: String!) { updateProfile(name: $name) { ...UserFields } }
`

export const UPDATE_AVATAR = `
  ${USER_FIELDS}
  mutation UpdateAvatar($image: String!) { updateAvatar(image: $image) { ...UserFields } }
`

export const REMOVE_AVATAR = `
  ${USER_FIELDS}
  mutation RemoveAvatar { removeAvatar { ...UserFields } }
`

export const CATEGORIES = `
  ${CATEGORY_FIELDS}
  query Categories { categories { ...CategoryFields } }
`

export const CATEGORY_STATS = `
  query CategoryStats {
    categoryStats {
      totalCategories
      totalTransactions
      mostUsed { id title icon color }
    }
  }
`

export const CREATE_CATEGORY = `
  ${CATEGORY_FIELDS}
  mutation CreateCategory($input: CategoryInput!) {
    createCategory(input: $input) { ...CategoryFields }
  }
`

export const UPDATE_CATEGORY = `
  ${CATEGORY_FIELDS}
  mutation UpdateCategory($id: ID!, $input: CategoryInput!) {
    updateCategory(id: $id, input: $input) { ...CategoryFields }
  }
`

export const DELETE_CATEGORY = `
  mutation DeleteCategory($id: ID!) { deleteCategory(id: $id) }
`

export const TRANSACTIONS = `
  ${TRANSACTION_FIELDS}
  query Transactions($filter: TransactionFilter, $page: Int, $pageSize: Int) {
    transactions(filter: $filter, page: $page, pageSize: $pageSize) {
      items { ...TransactionFields }
      total
      page
      pageSize
      totalPages
    }
  }
`

export const SUMMARY = `
  query Summary($month: Int, $year: Int) {
    summary(month: $month, year: $year) { balanceCents incomeCents expenseCents }
  }
`

export const CREATE_TRANSACTION = `
  ${TRANSACTION_FIELDS}
  mutation CreateTransaction($input: TransactionInput!) {
    createTransaction(input: $input) { ...TransactionFields }
  }
`

export const UPDATE_TRANSACTION = `
  ${TRANSACTION_FIELDS}
  mutation UpdateTransaction($id: ID!, $input: TransactionInput!) {
    updateTransaction(id: $id, input: $input) { ...TransactionFields }
  }
`

export const DELETE_TRANSACTION = `
  mutation DeleteTransaction($id: ID!) { deleteTransaction(id: $id) }
`
