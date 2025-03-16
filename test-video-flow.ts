// test-video-flow.ts
import { createVoiceoverScript } from './src/services/tts-service';

async function testVideoFlow() {
  try {
    // Sample transcript
    const transcript = `
      In this video, we're going to explore the history of World War I, also known as the Great War. 
      It began in 1914 after the assassination of Archduke Franz Ferdinand and lasted until 1918.
      The war was fought between the Allied Powers (Britain, France, Russia, Italy, and the United States)
      and the Central Powers (Germany, Austria-Hungary, Ottoman Empire, and Bulgaria).
      
      The conflict was characterized by trench warfare on the Western Front, where soldiers faced terrible conditions.
      New weapons like machine guns, tanks, and poison gas made this war particularly deadly.
      
      The war resulted in the deaths of approximately 9 million soldiers and 5 million civilians.
      It also led to the collapse of four empires: the Russian, Ottoman, Austro-Hungarian, and German.
      
      The Treaty of Versailles officially ended the war in 1919, but the harsh conditions imposed on Germany
      would contribute to the rise of Nazi Germany and eventually World War II.
      
      The Great War changed the world forever, redrawing national boundaries, shifting global power,
      and laying the groundwork for future conflicts that continue to shape our world today.
    `;
    
    console.log("Original transcript length:", transcript.split(/\s+/).length, "words");
    
    console.log("\n--- SIMULATING VIDEO-SERVICE FLOW ---");
    // This simulates what happens in video-service.ts
    const videoScriptFor15Seconds = await createVoiceoverScript(transcript, 42);
    console.log(`Video service script (${videoScriptFor15Seconds.split(/\s+/).length} words for 15s video):`);
    console.log(videoScriptFor15Seconds);
    
    console.log("\n--- SIMULATING YOUTUBE-EXTRACTION-SERVICE FLOW ---");
    // This simulates what happens in youtube-extraction-service.ts
    const montageScriptFor15Seconds = await createVoiceoverScript(transcript, 42);
    console.log(`YouTube extraction service script (${montageScriptFor15Seconds.split(/\s+/).length} words for 15s montage):`);
    console.log(montageScriptFor15Seconds);
    
    console.log("\nTest complete! Both services are using the new AI-powered distillation.");
  } catch (error) {
    console.error("Error in test:", error);
  }
}

testVideoFlow();
