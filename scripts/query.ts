import prisma from './lib/prisma'
prisma.user.findUnique({where:{id:'cmv2bflut0001b69yrzu0phof'}}).then(console.log).finally(() => prisma.$disconnect())
