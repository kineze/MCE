import 'dotenv/config'
import { hashPassword } from '../server/services/auth/password'
import { administratorSchema, normalizeEmail } from '../server/services/auth/validation'
import { prisma } from '../server/utils/prisma'

const ADMIN_PERMISSIONS = [
  ['system.admin', 'Access the administrative area'],
  ['users.read', 'View users'],
  ['users.manage', 'Create and manage users'],
  ['users.delete', 'Permanently delete users'],
  ['roles.read', 'View roles and permissions'],
  ['roles.manage', 'Manage roles and permissions'],
  ['settings.read', 'View system settings'],
  ['settings.manage', 'Change system settings'],
] as const

async function main(): Promise<void> {
  const input = administratorSchema.safeParse({
    email: process.env.ADMIN_EMAIL,
    displayName: process.env.ADMIN_NAME,
    password: process.env.ADMIN_PASSWORD,
  })

  if (!input.success) {
    throw new Error(
      `Invalid administrator details: ${input.error.issues.map(issue => issue.message).join('; ')}`,
    )
  }

  const email = normalizeEmail(input.data.email)
  const existingAdministrator = await prisma.user.findFirst({
    where: { roles: { some: { role: { key: 'super_admin' } } } },
    select: { email: true },
  })

  if (existingAdministrator) {
    throw new Error(
      `A super administrator already exists (${existingAdministrator.email}). No changes were made.`,
    )
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    throw new Error(`A user with ${email} already exists. No changes were made.`)
  }

  const passwordHash = await hashPassword(input.data.password)

  await prisma.$transaction(async (transaction) => {
    const role = await transaction.role.upsert({
      where: { key: 'super_admin' },
      create: {
        key: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system administration',
        isSystem: true,
      },
      update: {
        name: 'Super Administrator',
        description: 'Full system administration',
        isSystem: true,
      },
    })

    for (const [key, description] of ADMIN_PERMISSIONS) {
      const permission = await transaction.permission.upsert({
        where: { key },
        create: { key, description },
        update: { description },
      })

      await transaction.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        create: { roleId: role.id, permissionId: permission.id },
        update: {},
      })
    }

    const user = await transaction.user.create({
      data: {
        email,
        displayName: input.data.displayName,
        passwordHash,
      },
    })

    await transaction.userRole.create({
      data: { userId: user.id, roleId: role.id },
    })
  })

  console.log(`Created super administrator ${email}.`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Administrator creation failed.')
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
