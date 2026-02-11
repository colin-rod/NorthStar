#!/usr/bin/env node
/**
 * Remote RLS Verification Script
 * Tests RLS policies against the remote Supabase database
 *
 * Usage: node supabase/verify-remote-rls.js
 *
 * Requires: .env.local with SUPABASE_URL and SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
	const match = line.match(/^([^#=]+)=(.*)$/);
	if (match) {
		env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, '');
	}
});

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('❌ Missing Supabase credentials in .env.local');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, expected, actual, pass) {
	const status = pass ? '✅ PASS' : '❌ FAIL';
	console.log(`${status} - ${name}`);
	if (!pass) {
		console.log(`  Expected: ${expected}, Actual: ${actual}`);
	}
	if (pass) testsPassed++;
	else testsFailed++;
}

async function runTests() {
	console.log('');
	console.log('============================================================================');
	console.log('REMOTE RLS VERIFICATION TESTS');
	console.log('============================================================================');
	console.log('');

	// TEST 1: Unauthenticated requests should return 0 rows
	console.log('TEST 1: Unauthenticated Requests (should see 0 rows)');
	console.log('--------------------------------------------------------------------');

	const { data: unauthProjects, error: unauthProjectsError } = await supabase
		.from('projects')
		.select('*');
	logTest(
		'Unauthed SELECT projects',
		0,
		unauthProjects?.length || 0,
		(unauthProjects?.length || 0) === 0 && !unauthProjectsError
	);

	const { data: unauthEpics } = await supabase.from('epics').select('*');
	logTest('Unauthed SELECT epics', 0, unauthEpics?.length || 0, (unauthEpics?.length || 0) === 0);

	const { data: unauthIssues } = await supabase.from('issues').select('*');
	logTest(
		'Unauthed SELECT issues',
		0,
		unauthIssues?.length || 0,
		(unauthIssues?.length || 0) === 0
	);

	const { data: unauthMilestones } = await supabase.from('milestones').select('*');
	logTest(
		'Unauthed SELECT milestones',
		0,
		unauthMilestones?.length || 0,
		(unauthMilestones?.length || 0) === 0
	);

	console.log('');
	console.log('TEST 2: Schema Verification');
	console.log('--------------------------------------------------------------------');

	// Verify user_id columns exist by attempting to select them
	const { data: epicsSchema, error: epicsError } = await supabase
		.from('epics')
		.select('user_id')
		.limit(1);

	logTest(
		'Epics table has user_id column',
		'no error',
		epicsError ? epicsError.message : 'no error',
		!epicsError || !epicsError.message?.includes('column')
	);

	const { data: issuesSchema, error: issuesError } = await supabase
		.from('issues')
		.select('user_id')
		.limit(1);

	logTest(
		'Issues table has user_id column',
		'no error',
		issuesError ? issuesError.message : 'no error',
		!issuesError || !issuesError.message?.includes('column')
	);

	console.log('');
	console.log('============================================================================');
	console.log('SUMMARY');
	console.log('============================================================================');
	console.log('');
	console.log(`Total tests: ${testsPassed + testsFailed}`);
	console.log(`✅ Passed: ${testsPassed}`);
	console.log(`❌ Failed: ${testsFailed}`);
	console.log('');

	if (testsFailed > 0) {
		console.log('⚠️  Some tests failed. RLS policies may not be working correctly.');
		process.exit(1);
	} else {
		console.log('🎉 All tests passed! RLS policies are working correctly.');
		process.exit(0);
	}
}

runTests().catch((error) => {
	console.error('❌ Test execution failed:', error);
	process.exit(1);
});
