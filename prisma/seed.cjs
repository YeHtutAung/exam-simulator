require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const exam = await prisma.exam.upsert({
    where: { code: "FE-2020-10-AM" },
    update: {
      title: "Fundamentals of Engineering",
      session: "2020 Autumn",
      paper: "AM",
      language: "JA",
    },
    create: {
      code: "FE-2020-10-AM",
      title: "Fundamentals of Engineering",
      session: "2020 Autumn",
      paper: "AM",
      language: "JA",
    },
  });

  await prisma.question.upsert({
    where: {
      examId_questionNo: {
        examId: exam.id,
        questionNo: 1,
      },
    },
    update: {
      type: "MCQ_SINGLE",
      stem: "Which TCP/IP layer does IP belong to?",
      correctAnswer: "c",
      explanation: "IP is part of the network layer.",
      choices: {
        deleteMany: {},
        create: [
          { label: "a", text: "TCP", sortOrder: 1 },
          { label: "b", text: "UDP", sortOrder: 2 },
          { label: "c", text: "IP", sortOrder: 3 },
          { label: "d", text: "HTTP", sortOrder: 4 },
        ],
      },
    },
    create: {
      examId: exam.id,
      questionNo: 1,
      type: "MCQ_SINGLE",
      stem: "Which TCP/IP layer does IP belong to?",
      correctAnswer: "c",
      explanation: "IP is part of the network layer.",
      choices: {
        create: [
          { label: "a", text: "TCP", sortOrder: 1 },
          { label: "b", text: "UDP", sortOrder: 2 },
          { label: "c", text: "IP", sortOrder: 3 },
          { label: "d", text: "HTTP", sortOrder: 4 },
        ],
      },
    },
  });

  await prisma.question.upsert({
    where: {
      examId_questionNo: {
        examId: exam.id,
        questionNo: 8,
      },
    },
    update: {
      type: "NUMERIC",
      stem: "Compute the result of the given formula.",
      correctAnswer: "11",
      explanation: "The result is 11.",
      attachments: {
        deleteMany: {},
        create: [
          {
            type: "IMAGE",
            url: "https://placehold.co/600x240/png",
            caption: "Formula diagram",
            width: 600,
            height: 240,
            sortOrder: 1,
          },
        ],
      },
    },
    create: {
      examId: exam.id,
      questionNo: 8,
      type: "NUMERIC",
      stem: "Compute the result of the given formula.",
      correctAnswer: "11",
      explanation: "The result is 11.",
      attachments: {
        create: [
          {
            type: "IMAGE",
            url: "https://placehold.co/600x240/png",
            caption: "Formula diagram",
            width: 600,
            height: 240,
            sortOrder: 1,
          },
        ],
      },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
