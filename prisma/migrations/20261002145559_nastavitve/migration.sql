-- CreateTable
CREATE TABLE "nastavitve" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "izdajateljIme" TEXT NOT NULL DEFAULT '',
    "izdajateljUlica" TEXT NOT NULL DEFAULT '',
    "izdajateljPosta" TEXT NOT NULL DEFAULT '',
    "izdajateljDrzava" TEXT NOT NULL DEFAULT 'Slovenija',
    "davcnaStevilka" TEXT NOT NULL DEFAULT '',
    "maticnaStevilka" TEXT NOT NULL DEFAULT '',
    "zavezanecZaDdv" BOOLEAN NOT NULL DEFAULT false,
    "klavzulaBrezDdv" TEXT NOT NULL DEFAULT 'DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.',
    "iban" TEXT NOT NULL DEFAULT '',
    "banka" TEXT NOT NULL DEFAULT '',
    "bic" TEXT NOT NULL DEFAULT '',
    "telefon" TEXT NOT NULL DEFAULT '',
    "epota" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nastavitve_pkey" PRIMARY KEY ("id")
);
