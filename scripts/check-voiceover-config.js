#!/usr/bin/env node

/**
 * This script checks if AI voiceover is properly configured in the .env file
 * and provides recommendations to fix any issues.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
const envPath = path.join(process.cwd(), '.env');
let envConfig = {};

try {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envConfig = dotenv.parse(envFile);
    console.log('✅ Found .env file');
  } else {
    console.log('❌ No .env file found. Creating one from .env.example...');
    
    // Check if .env.example exists
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      const exampleFile = fs.readFileSync(examplePath, 'utf8');
      fs.writeFileSync(envPath, exampleFile);
      envConfig = dotenv.parse(exampleFile);
      console.log('✅ Created .env file from .env.example');
    } else {
      console.log('❌ No .env.example file found. Please create a .env file manually.');
      process.exit(1);
    }
  }
} catch (error) {
  console.error('Error reading/parsing .env file:', error);
  process.exit(1);
}

// Check AI voiceover configuration
console.log('\n==== AI Voiceover Configuration ====');

let configIssues = [];

// Check AI_VOICEOVER_ENABLED
if (envConfig.AI_VOICEOVER_ENABLED !== 'true') {
  configIssues.push('AI_VOICEOVER_ENABLED is not set to "true"');
  console.log('❌ AI_VOICEOVER_ENABLED:', envConfig.AI_VOICEOVER_ENABLED || '(not set)');
} else {
  console.log('✅ AI_VOICEOVER_ENABLED: true');
}

// Check OPENAI_API_KEY if using OpenAI
if ((!envConfig.VOICEOVER_TTS_SERVICE || envConfig.VOICEOVER_TTS_SERVICE === 'openai') && 
    (!envConfig.OPENAI_API_KEY || envConfig.OPENAI_API_KEY === 'your_openai_api_key')) {
  configIssues.push('OPENAI_API_KEY is not set or is using the default value');
  console.log('❌ OPENAI_API_KEY:', envConfig.OPENAI_API_KEY ? '(using default example value)' : '(not set)');
} else if (!envConfig.VOICEOVER_TTS_SERVICE || envConfig.VOICEOVER_TTS_SERVICE === 'openai') {
  console.log('✅ OPENAI_API_KEY: (configured)');
}

// Check ELEVENLABS_API_KEY if using ElevenLabs
if (envConfig.VOICEOVER_TTS_SERVICE === 'elevenlabs' && 
    (!envConfig.ELEVENLABS_API_KEY || envConfig.ELEVENLABS_API_KEY === 'your_elevenlabs_api_key')) {
  configIssues.push('ELEVENLABS_API_KEY is not set or is using the default value');
  console.log('❌ ELEVENLABS_API_KEY:', envConfig.ELEVENLABS_API_KEY ? '(using default example value)' : '(not set)');
} else if (envConfig.VOICEOVER_TTS_SERVICE === 'elevenlabs') {
  console.log('✅ ELEVENLABS_API_KEY: (configured)');
}

// Check VOICEOVER_TTS_SERVICE
if (!envConfig.VOICEOVER_TTS_SERVICE) {
  console.log('ℹ️ VOICEOVER_TTS_SERVICE: (not set, will use default "openai")');
} else if (envConfig.VOICEOVER_TTS_SERVICE !== 'openai' && envConfig.VOICEOVER_TTS_SERVICE !== 'elevenlabs') {
  configIssues.push('VOICEOVER_TTS_SERVICE must be either "openai" or "elevenlabs"');
  console.log('❌ VOICEOVER_TTS_SERVICE:', envConfig.VOICEOVER_TTS_SERVICE, '(invalid)');
} else {
  console.log('✅ VOICEOVER_TTS_SERVICE:', envConfig.VOICEOVER_TTS_SERVICE);
}

// Check VOICEOVER_VOICE
if (!envConfig.VOICEOVER_VOICE) {
  console.log('ℹ️ VOICEOVER_VOICE: (not set, will use default "alloy")');
} else {
  console.log('✅ VOICEOVER_VOICE:', envConfig.VOICEOVER_VOICE);
}

// Check VOICEOVER_VOLUME
if (!envConfig.VOICEOVER_VOLUME) {
  console.log('ℹ️ VOICEOVER_VOLUME: (not set, will use default 0.8)');
} else if (isNaN(parseFloat(envConfig.VOICEOVER_VOLUME)) || 
           parseFloat(envConfig.VOICEOVER_VOLUME) < 0 || 
           parseFloat(envConfig.VOICEOVER_VOLUME) > 1) {
  configIssues.push('VOICEOVER_VOLUME must be a number between 0.0 and 1.0');
  console.log('❌ VOICEOVER_VOLUME:', envConfig.VOICEOVER_VOLUME, '(invalid)');
} else {
  console.log('✅ VOICEOVER_VOLUME:', envConfig.VOICEOVER_VOLUME);
}

// Check REMOVE_AUDIO (potential conflict)
if (envConfig.REMOVE_AUDIO === 'true') {
  console.log('⚠️ REMOVE_AUDIO: true (This will remove original audio from clips but AI voiceover will still be added)');
}

// Check USE_CUSTOM_SOUNDTRACK (combined usage)
if (envConfig.USE_CUSTOM_SOUNDTRACK === 'true') {
  console.log('ℹ️ USE_CUSTOM_SOUNDTRACK: true (Soundtrack will be mixed with AI voiceover)');
  
  // Check SOUNDTRACK_PATH
  if (!envConfig.SOUNDTRACK_PATH || !fs.existsSync(path.join(process.cwd(), envConfig.SOUNDTRACK_PATH))) {
    configIssues.push('SOUNDTRACK_PATH is not set or the file does not exist');
    console.log('❌ SOUNDTRACK_PATH:', envConfig.SOUNDTRACK_PATH, '(not found)');
  } else {
    console.log('✅ SOUNDTRACK_PATH:', envConfig.SOUNDTRACK_PATH);
  }
}

// Provide remediation steps if there are issues
if (configIssues.length > 0) {
  console.log('\n==== Configuration Issues ====');
  console.log('The following issues need to be fixed in your .env file:');
  configIssues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
  
  console.log('\nRecommended .env settings for AI voiceover:');
  console.log(`
AI_VOICEOVER_ENABLED=true
VOICEOVER_TTS_SERVICE=openai
VOICEOVER_VOICE=alloy
VOICEOVER_VOLUME=0.8
OPENAI_API_KEY=your_actual_openai_api_key_here
  `);
} else {
  console.log('\n✅ AI voiceover is properly configured!');
}

console.log('\nRun "npm start" to generate a video with AI voiceover.');
