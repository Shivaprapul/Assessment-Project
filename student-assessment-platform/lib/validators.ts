/**
 * Validation Utilities
 * 
 * Zod schemas for request validation.
 * 
 * @module lib/validators
 */

import { z } from 'zod';

// Authentication schemas
export const sendOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const verifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

// Student profile schemas
export const updateStudentProfileSchema = z.object({
  goals: z.array(z.string().max(100)).max(5).optional(),
  preferredMode: z.enum(['EXPLORER', 'FACILITATOR']).optional(),
  avatar: z.string().url().optional(),
});

// Assessment schemas
export const startAssessmentSchema = z.object({
  gameId: z.string().min(1, 'Game ID is required'),
});

export const updateAssessmentProgressSchema = z.object({
  state: z.record(z.string(), z.any()),
  telemetry: z.record(z.string(), z.any()),
});

export const submitAssessmentSchema = z.object({
  answers: z.array(z.any()),
  telemetry: z.object({
    timeSpent: z.number(),
    actions: z.array(z.any()),
    errors: z.number().optional(),
    hintsUsed: z.number().optional(),
    revisions: z.number().optional(),
  }),
  reflectionText: z.string().optional(),
});

// Consent schemas
export const consentSchema = z.object({
  studentId: z.string().uuid('Invalid student ID'),
  purpose: z.enum([
    'ASSESSMENT',
    'DATA_PROCESSING',
    'AI_ANALYSIS',
    'PARENT_VISIBILITY',
    'TEACHER_VISIBILITY',
    'RESEARCH',
  ]),
  granted: z.boolean(),
});

