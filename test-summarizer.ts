#!/usr/bin/env ts-node

// This is a simple script to test our summarizer in isolation
import { summarizeTranscript } from './src/services/transcript-summarizer';
import { createVoiceoverScript } from './src/services/tts-service';

// Sample transcript
const transcript = `
How did World War 1 start? It's a complicated question, but this is how a relatively small regional conflict in the Balkans blew up to involve over 30 nations and become the deadliest conflict the world had ever seen.

The immediate trigger was the assassination of Archduke Franz Ferdinand, heir to the Austro-Hungarian Empire, in Sarajevo on June 28, 1914. He was killed by Gavrilo Princip, a Bosnian Serb nationalist who wanted to end Austro-Hungarian rule over Bosnia and Herzegovina.

This assassination set off a chain reaction. Austria-Hungary, backed by Germany, declared war on Serbia. Russia, an ally of Serbia, began to mobilize its forces. Germany then declared war on Russia. France was bound by treaty to Russia, so Germany declared war on France as well.

When German forces invaded neutral Belgium to attack France, Britain declared war on Germany. The Ottoman Empire (Turkey) later joined the war on Germany's side, while Italy, Japan, and the United States eventually joined the Allies (Britain, France, Russia).

But the deeper causes of World War 1 were more complex. There was intense competition among European powers, with rival alliance systems (the Triple Alliance of Germany, Austria-Hungary, and Italy versus the Triple Entente of Britain, France, and Russia). There was also a dangerous arms race, especially naval competition between Britain and Germany.

Nationalism was another factor, with many ethnic groups seeking independence or unification. Imperialism played a role too, as European powers competed for colonies and resources around the world. The Balkans, sometimes called the "powder keg of Europe," was particularly unstable due to competing nationalist movements and the decline of the Ottoman Empire.

So while the assassination of Franz Ferdinand was the spark, it ignited a powder keg of long-standing tensions, rivalries, and alliance obligations that had been building for decades.
`;

async function test() {
  console.log("Original transcript length (words):", transcript.split(/\s+/).length);
  
  try {
    // Test summarizeTranscript directly
    console.log("\n--- Testing summarizeTranscript ---");
    const summary = await summarizeTranscript(transcript, 42);
    console.log("Summary:", summary);
    console.log("Summary length (words):", summary.split(/\s+/).length);
    
    // Test createVoiceoverScript which uses summarizeTranscript
    console.log("\n--- Testing createVoiceoverScript ---");
    const script = await createVoiceoverScript(transcript, 42);
    console.log("Script:", script);
    console.log("Script length (words):", script.split(/\s+/).length);
  } catch (error) {
    console.error("Error:", error);
  }
}

test();
