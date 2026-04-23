import emailjs from 'emailjs-com'

// Environment variables should be defined in .env.local
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || ''
const TEMPLATE_INVITE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_INVITE || ''
const TEMPLATE_EXPENSE = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_EXPENSE || ''
const TEMPLATE_ADJUSTMENT = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ADJUSTMENT || ''
const TEMPLATE_SETTLEMENT = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_SETTLEMENT || ''
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || ''

export const emailService = {
  sendInviteNotification: async ({
    toEmail, toName, groupName, inviterName
  }: {
    toEmail: string, toName: string, groupName: string, inviterName: string
  }) => {
    if (!SERVICE_ID || !TEMPLATE_INVITE || !PUBLIC_KEY) return
    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_INVITE, {
        to_email: toEmail,
        to_name: toName,
        group_name: groupName,
        inviter_name: inviterName,
        app_url: window.location.origin
      }, PUBLIC_KEY)
    } catch (error) {
      console.error('Failed to send invite email:', error)
    }
  },

  sendExpenseNotification: async ({
    toEmail, groupName, expenseTitle, paidBy, totalAmountFormatted, yourShareFormatted, balanceLabel
  }: {
    toEmail: string, groupName: string, expenseTitle: string, paidBy: string, totalAmountFormatted: string, yourShareFormatted: string, balanceLabel: string
  }) => {
    if (!SERVICE_ID || !TEMPLATE_EXPENSE || !PUBLIC_KEY) return
    try {
      const subject = `[${groupName}] New expense: ${expenseTitle}`
      const message_body = `
${paidBy} added a new expense in ${groupName}.

Expense: ${expenseTitle}
Total Amount: ${totalAmountFormatted}
Your Share: ${yourShareFormatted}

Your current balance: ${balanceLabel}
`
      await emailjs.send(SERVICE_ID, TEMPLATE_EXPENSE, {
        to_email: toEmail,
        subject,
        message_body
      }, PUBLIC_KEY)
    } catch (error) {
      console.error('Failed to send expense email:', error)
    }
  },

  sendAdjustmentNotification: async ({
    toEmail, groupName, adjustedBy, amountFormatted, direction, note, balanceLabel
  }: {
    toEmail: string, groupName: string, adjustedBy: string, amountFormatted: string, direction: string, note: string, balanceLabel: string
  }) => {
    if (!SERVICE_ID || !TEMPLATE_ADJUSTMENT || !PUBLIC_KEY) return
    try {
      const subject = `[${groupName}] Your balance was updated`
      const message_body = `
${adjustedBy} made a manual adjustment in ${groupName}.

Amount: ${amountFormatted} (${direction})
Note: ${note}

Your new balance: ${balanceLabel}
`
      await emailjs.send(SERVICE_ID, TEMPLATE_ADJUSTMENT, {
        to_email: toEmail,
        subject,
        message_body
      }, PUBLIC_KEY)
    } catch (error) {
      console.error('Failed to send adjustment email:', error)
    }
  },

  sendSettlementNotification: async ({
    toEmail, groupName, payerName, receiverName, amountFormatted
  }: {
    toEmail: string, groupName: string, payerName: string, receiverName: string, amountFormatted: string
  }) => {
    if (!SERVICE_ID || !TEMPLATE_SETTLEMENT || !PUBLIC_KEY) return
    try {
      const subject = `[${groupName}] Settlement confirmed ✓`
      const message_body = `
A settlement was recorded in ${groupName}.

${payerName} paid ${receiverName}: ${amountFormatted}

You are now settled up ✓
`
      await emailjs.send(SERVICE_ID, TEMPLATE_SETTLEMENT, {
        to_email: toEmail,
        subject,
        message_body
      }, PUBLIC_KEY)
    } catch (error) {
      console.error('Failed to send settlement email:', error)
    }
  }
}

