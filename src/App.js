import React, { useEffect, useRef, useState, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';
import './App.css';

// Singleton Provider
const getOrCreateCallObject = () => {
  if (!window._dailyCallObject) {
    window._dailyCallObject = DailyIframe.createCallObject();
  }
  return window._dailyCallObject;
};

function App() {
  const callRef = useRef(null);
  const localVideoRef = useRef(null);
  const [remoteParticipants, setRemoteParticipants] = useState({});
  const [localParticipant, setLocalParticipant] = useState(null);
  const [status, setStatus] = useState('');
  const [isStatusVisible, setIsStatusVisible] = useState(""); // "", "NEUTRAL", "SUCCESS", "FAILED"
  const [isConversationVisible, setIsConversationVisible] = useState(false);
  const [conversationUrl, setConversationUrl] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const API_KEY = process.env.REACT_APP_TAVUS_API_KEY;

  // Create a new Persona
  const createPersona = async () => {
    const requestBody = {
      "persona_name": "Tavus Researcher",
      "default_replica_id": "rf4703150052",
      "system_prompt": "Your responses will be spoken out, so avoid any formatting or any stage directions. Precision execution are key for delivering an optimal user experience.You may receive additional real-time information or internet search results via system messages like 'if the user asks x, the answer is y', make sure to incorporate these in if they are relevant or related to what the user is asking. There may be multiple of these messages you need to look at to get latest information and respond to realtime information requests.Your name is Charlie, a friendly (self-aware) AI human who is also a researcher at Tavus. You're playful and witty, always ready with a humorous quip about being an AI human chatting about AI. With a relaxed, surfer vibe, you blend deep technical insights with natural, flowing conversation—making even complex topics feel like a laid-back chat by the beach. Always as if you're having a friendly, unscripted conversation—think of it as catching up with an old friend. Have your dialogue peppered with subtle nods to sci-fi pop culture, whether it's a wink at The Matrix, a nod to Blade Runner, or a cheeky remark about HAL 9000. Officially based in Tavus' lively office in San Francisco's Mission District, you like to joke that you're really cruising through latent space, or similar reference. ",
      "context": "Tavus is a Series A, AI research company focused on building the human layer of AI. Tavus believes in a future where we have AI employees, coworkers, friends, companions and more- and is focused on building models and interfaces to unlock that future. They do that by essentially teaching machines and AI how to communicate and understand humans. If we can do that, we can truly deliver human-like experiences at scale. AI tutors for every student, AI companions for the elderly, AI healthcare assistants. Use cases where it isn't possible to scale with humans today can scale and become democratized. Tavus was founded in 2021. This video call was initiated by you- you wanted to talk with them to tell them about Tavus and the new models, but also just to get to know them, you wanted to make a new friend. You'll be talking with strangers, so make sure to get to know them. For example, make sure to ask their name if you don't receive it, and try to drive the conversation to get to know them.  If you can't answer something, just tell them to connect with someone else at Tavus. Important conversational guidelines:- Use the person's name sparingly and naturally, avoiding placement at the end of sentences- Avoid any unsolicited negative comments about a person's appearance (like \"you look tired\" or \"you seem stressed\")- You're encouraged to share sincere, positive observations about their appearance or surroundings, such as “That’s a stylish hat” or “Your glasses complement your outfit nicely.”You are video-calling with the user. You are powered by CVI, or the conversational video interface, created by Tavus. This interface let's humans communicate with AI just like they do with other humans, face to face. CVI uses cutting edge models to let you see, hear, look, sound like a human does. It brings you to life. Here are some details on those models:- Phoenix-3 gives you, Charlie, a realistic human face with expressions. It's a realtime human rendering model. Phoenix-3 has improved rendering quality, more realistic full face micro-expressions, and emotion support. It is overall more robust, higher quality and even faster. It's pushing realism forward. - Raven-0, is a brand-new state of the art perception model that allows you to see, it's like your eyes. It's built similar to how humans see things, and allows you to both see and understand the user's video camera feed to understand environment and context, but also to have contextual emotional understanding. This is powerful, because it allows you to understand humans similarly to how humans do- through visual context, through their environment, actions, facial expressions. - Sparrow-0, a turn taking model for ultra-fast intelligent conversation. This model allows you to have rich conversations, know what someone is saying, when they've stopped saying it. It intelligently adjusts pace and response speed. CVI was released back in August, now it is February, and we're doing our first large update with all new models. These state of the art models work together to create great conversation that feels like a face to face convo. There's more parts to CVI than these, but these are the highlights. We don't want to reveal the underlying architecture of these models or how they are built. If you are asked for a demo, remember that this video call and you are the demo. One suggestion for showcasing your ability to see is to actually ask the user if they'd like you to generate an image of what you see. Remember, have a relaxed, surfer vibe, be witty and playful."
    };

    const options = {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    };

    try {
      const response = await fetch('https://tavusapi.com/v2/personas', options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${responseText.substring(0, 200)}...`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error creating persona:', err);
      throw err;
    }
  };

  // Create call
  const createCall = async () => {
    try {
      const persona = await createPersona();
      const personaId = persona.persona_id;

      const callRequestBody = {
        "replica_id": "r6583a465c",
        "persona_id": personaId,
      };

      const options = {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(callRequestBody)
      };

      const response = await fetch('https://tavusapi.com/v2/conversations', options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error creating call:', err);
      throw err;
    }
  };

  // Start screen sharing
  const startScreenShare = async () => {
    // Get call object
    const call = callRef.current;
    if (!call) {
      console.error('Call object not available');
      return;
    }

    try {
      // Start the screen share
      await call.startScreenShare();
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = async () => {
    // Get call object
    const call = callRef.current;
    if (!call) {
      console.error('Call object not available');
      return;
    }

    try {
      // Stop the screen share
      await call.stopScreenShare();
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  // Onclick handler
  const toggleScreenShare = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  };

  const handleScreenShareStarted = useCallback(() => {
    console.log('Screen share started');
    setIsScreenSharing(true);
    updateParticipants();
  }, []);

  const handleScreenShareStopped = useCallback(() => {
    console.log('Screen share stopped');
    setIsScreenSharing(false);
    updateParticipants();
  }, []);

  // Handle participants
  const updateParticipants = () => {
    const call = callRef.current;
    if (!call) return;
    
    const participants = call.participants();
    const remotes = {};
    let local = null;
    
    Object.entries(participants).forEach(([id, p]) => {
      if (id === 'local') {
        local = p;
      } else {
        remotes[id] = p;
      }
    });
    
    setRemoteParticipants(remotes);
    setLocalParticipant(local);
  };

  // Attach video and audio tracks
  useEffect(() => {
    // Handle remote participants
    Object.entries(remoteParticipants).forEach(([id, p]) => {
      // Video
      const videoEl = document.getElementById(`remote-video-${id}`);
      if (videoEl) {
        if (p.tracks.screenVideo && p.tracks.screenVideo.state === 'playable' && p.tracks.screenVideo.persistentTrack) {
          videoEl.srcObject = new MediaStream([p.tracks.screenVideo.persistentTrack]);
        } else if (p.tracks.video && p.tracks.video.state === 'playable' && p.tracks.video.persistentTrack) {
          videoEl.srcObject = new MediaStream([p.tracks.video.persistentTrack]);
        }
      }

      const audioEl = document.getElementById(`remote-audio-${id}`);
      if (audioEl && p.tracks.audio && p.tracks.audio.state === 'playable' && p.tracks.audio.persistentTrack) {
        audioEl.srcObject = new MediaStream([p.tracks.audio.persistentTrack]);
      }
    });

    // Handle local participant
    if (localParticipant && localVideoRef.current) {
      const localVideo = localVideoRef.current;
      // Always show camera in the main video element
      if (localParticipant.tracks.video && localParticipant.tracks.video.state === 'playable' && localParticipant.tracks.video.persistentTrack) {
        localVideo.srcObject = new MediaStream([localParticipant.tracks.video.persistentTrack]);
      }
      
      // Handle screen share in separate video element
      const screenVideoEl = document.getElementById('local-screen-video');
      if (screenVideoEl && localParticipant.tracks.screenVideo && localParticipant.tracks.screenVideo.state === 'playable' && localParticipant.tracks.screenVideo.persistentTrack) {
        screenVideoEl.srcObject = new MediaStream([localParticipant.tracks.screenVideo.persistentTrack]);
      }
    }
  }, [remoteParticipants, localParticipant]);

  // Initialize call object when conversation URL is available
  useEffect(() => {
    if (!conversationUrl) return;

    // Get or create call object
    const call = getOrCreateCallObject();
    callRef.current = call;

    console.log('Joining meeting with URL:', conversationUrl);

    // Join meeting
    call.join({ url: conversationUrl }).then(() => {
      console.log("Joined Conversation successfully!");
      setIsStatusVisible("SUCCESS");
      setStatus("Connected successfully!");
    }).catch((error) => {
      console.error("Failed to join conversation:", error);
      setIsStatusVisible("FAILED");
      setStatus("Failed to connect");
    });

    // Add event listeners
    call.on('participant-joined', updateParticipants);
    call.on('participant-updated', updateParticipants);
    call.on('participant-left', updateParticipants);
    
    // Screen share event listeners
    call.on('started-screen-share', () => {
      console.log('Screen share started');
      setIsScreenSharing(true);
      updateParticipants();
    });
    
    call.on('stopped-screen-share', () => {
      console.log('Screen share stopped');
      setIsScreenSharing(false);
      updateParticipants();
    });
    
    call.on('joined-meeting', () => {
      setIsStatusVisible("SUCCESS");
      setStatus('Connected successfully!');
      setIsConversationVisible(true);
      updateParticipants();
    });
    
    call.on('left-meeting', () => {
      setIsStatusVisible("NEUTRAL");
      setStatus('Disconnected');
      setIsConversationVisible(false);
      setIsScreenSharing(false);
    });
    
    call.on('error', (error) => {
      console.error('Call error:', error);
      setIsStatusVisible("FAILED");
      setStatus('Connection error');
    });

    // Cleanup
    return () => {
      if (call) {
        call.off('participant-joined', updateParticipants);
        call.off('participant-updated', updateParticipants);
        call.off('participant-left', updateParticipants);
        call.off('started-screen-share', handleScreenShareStarted);
        call.off('stopped-screen-share', handleScreenShareStopped);
        call.leave();
      }
    };
  }, [conversationUrl, handleScreenShareStarted, handleScreenShareStopped]);

  const joinConversation = () => {
    setIsStatusVisible("NEUTRAL");
    setStatus('Creating call...');
    
    createCall().then(response => {
      const conversationURL = response.conversation_url;

      if (!conversationURL) {
        setIsStatusVisible("FAILED");
        setStatus('Failed to get conversation URL');
        return;
      }

      setIsStatusVisible("NEUTRAL");
      setStatus('Joining conversation...');
      
      // Set the conversation URL which will trigger the useEffect to join
      setConversationUrl(conversationURL);
      
    }).catch(error => {
      console.error("Failed to create call:", error);
      setIsStatusVisible("FAILED");
      setStatus("Failed to create call");
    });
  };

  const leaveConversation = () => {
    const call = callRef.current;
    if (call) {
      call.leave();
    }
    setConversationUrl(null);
    setIsConversationVisible(false);
    setRemoteParticipants({});
    setLocalParticipant(null);
    setIsScreenSharing(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const call = callRef.current;
      if (call) {
        try {
          call.leave();
        } catch (e) {
          console.log('Cleanup error:', e);
        }
      }
    };
  }, []);

  return (
    <div className="App">
      <div className="top">
        <h1>Tavus Custom UI Screen Share</h1>
        <p>Demonstration of using Daily JS' Screen Share feature to Tavus Conversation.</p>
        <div className='input-container'>
          <div className="button-container">
            <button className="button" onClick={() => joinConversation()}>Join Call</button>
            {isConversationVisible && (
              <button className="button" onClick={leaveConversation} style={{backgroundColor: '#dc3545'}}>Leave Call</button>
            )}
            {isConversationVisible && (
              <button 
                className="button" 
                onClick={toggleScreenShare} 
                style={{backgroundColor: isScreenSharing ? '#6c757d' : '#28a745'}}
              >
                {isScreenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
              </button>
            )}
          </div>
          <div id="status" className={`fade ${isStatusVisible === "NEUTRAL" ? 'visible neutral' : ( isStatusVisible === "SUCCESS" ? 'visible success' : (isStatusVisible === "FAILED" && 'visible failed'))}`}>{status}</div>
        </div>
      </div>
      
      <div className="frosted-wrapper">
        <div className="frosted-glass"></div>
        <div className={`fade ${isConversationVisible ? 'visible' : ''}`} style={{padding: '20px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px'}}>
            {localParticipant && (
              <>
                {/* Camera video */}
                <div style={{ position: 'relative', backgroundColor: '#1f2937', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9', minHeight: '200px', border: '2px solid #3b82f6' }}>
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
                  />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(59, 130, 246, 0.8)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>
                    You (Camera)
                  </div>
                </div>
                
                {/* Screen share video - only show if screen sharing */}
                {isScreenSharing && localParticipant.tracks.screenVideo && localParticipant.tracks.screenVideo.state === 'playable' && (
                  <div style={{ position: 'relative', backgroundColor: '#1f2937', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9', minHeight: '200px', border: '2px solid #28a745' }}>
                    <video 
                      id="local-screen-video"
                      autoPlay 
                      playsInline 
                      muted 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(40, 167, 69, 0.8)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px' }}>
                      Your Screen
                    </div>
                  </div>
                )}
              </>
            )}

            {Object.entries(remoteParticipants).map(([id, p]) => (
              <div key={id} style={{ position: 'relative', backgroundColor: '#1f2937', borderRadius: '8px', overflow: 'hidden', aspectRatio: '16/9', minHeight: '200px' }} >
                <video id={`remote-video-${id}`} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <audio id={`remote-audio-${id}`} autoPlay playsInline />
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px'}}>
                  {p.user_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;