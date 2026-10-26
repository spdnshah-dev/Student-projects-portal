-- AlterEnum: a fourth login type. Recruiters browse the public portal like a
-- visitor; the only difference is that student LinkedIn URLs are revealed to
-- them (and to no one else) via a server-authorized endpoint.
ALTER TYPE "Role" ADD VALUE 'RECRUITER';
