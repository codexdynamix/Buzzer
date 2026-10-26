
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseWebRTCOptions {
  userId: string;
  roomId?: string;
}

export const useWebRTC = ({ userId, roomId }: UseWebRTCOptions) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const dataChannelsRef = useRef<Record<string, RTCDataChannel>>({});
  const socketRef = useRef<WebSocket | null>(null);
  
  // Initialize media devices and WebRTC
  const initializeCall = useCallback(async () => {
    try {
      // Request user media (audio/video)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      setLocalStream(stream);
      connectToSignalingServer();
      
      toast.success("Call initialized");
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast.error("Failed to access camera/microphone");
    }
  }, []);
  
  // Connect to WebSocket signaling server
  const connectToSignalingServer = () => {
    try {
      // Connect to the signaling server
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/webrtc`;
      
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('Connected to signaling server');
        
        // Join room if roomId is provided
        if (roomId) {
          socketRef.current?.send(JSON.stringify({
            type: 'join',
            roomId,
            userId
          }));
        }
      };
      
      socketRef.current.onmessage = handleSignalingMessage;
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error("Connection error");
      };
      
      socketRef.current.onclose = () => {
        console.log('Disconnected from signaling server');
        toast.error("Disconnected from call");
      };
    } catch (error) {
      console.error('Failed to connect to signaling server:', error);
      toast.error("Failed to connect to call server");
    }
  };
  
  // Handle incoming messages from signaling server
  const handleSignalingMessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'user-joined':
          // A new user joined, create a peer connection for them
          createPeerConnection(message.userId);
          toast.info(`${message.userId} joined the call`);
          break;
          
        case 'user-left':
          // A user left, clean up their peer connection
          cleanupPeerConnection(message.userId);
          toast.info(`${message.userId} left the call`);
          break;
          
        case 'offer':
          // Received an offer, create answer
          await handleOffer(message);
          break;
          
        case 'answer':
          // Received an answer to our offer
          await handleAnswer(message);
          break;
          
        case 'ice-candidate':
          // Received ICE candidate
          await handleIceCandidate(message);
          break;
          
        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle signaling message:', error);
      toast.error("Error in call connection");
    }
  };
  
  // Create a new peer connection for a user
  const createPeerConnection = async (peerId: string) => {
    try {
      // ICE servers configuration (STUN/TURN)
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ];
      
      const peerConnection = new RTCPeerConnection({ iceServers });
      
      // Store the peer connection
      peerConnectionsRef.current[peerId] = peerConnection;
      
      // Setup event handlers
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send ICE candidate to peer
          socketRef.current?.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            targetUserId: peerId
          }));
        }
      };
      
      peerConnection.ontrack = (event) => {
        // Add remote stream
        setRemoteStreams(prev => ({
          ...prev,
          [peerId]: event.streams[0]
        }));
      };
      
      // Add local tracks to the peer connection
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }
      
      // Create data channel
      const dataChannel = peerConnection.createDataChannel('chat');
      dataChannelsRef.current[peerId] = dataChannel;
      
      dataChannel.onopen = () => {
        console.log(`Data channel with ${peerId} opened`);
      };
      
      dataChannel.onmessage = (event) => {
        console.log(`Received message from ${peerId}:`, event.data);
      };
      
      // If we're the initiator, create an offer
      if (roomId) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Send offer to peer
        socketRef.current?.send(JSON.stringify({
          type: 'offer',
          offer,
          targetUserId: peerId
        }));
      }
      
      return peerConnection;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      toast.error("Failed to establish peer connection");
      return null;
    }
  };
  
  // Handle incoming offer
  const handleOffer = async (message: any) => {
    try {
      const { userId: peerId, offer } = message;
      
      // Create peer connection if it doesn't exist
      let peerConnection = peerConnectionsRef.current[peerId];
      if (!peerConnection) {
        peerConnection = await createPeerConnection(peerId);
        if (!peerConnection) return;
      }
      
      // Set remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer to peer
      socketRef.current?.send(JSON.stringify({
        type: 'answer',
        answer,
        targetUserId: peerId
      }));
    } catch (error) {
      console.error('Failed to handle offer:', error);
      toast.error("Failed to process incoming call");
    }
  };
  
  // Handle incoming answer
  const handleAnswer = async (message: any) => {
    try {
      const { userId: peerId, answer } = message;
      
      const peerConnection = peerConnectionsRef.current[peerId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Failed to handle answer:', error);
      toast.error("Failed to establish connection");
    }
  };
  
  // Handle incoming ICE candidate
  const handleIceCandidate = async (message: any) => {
    try {
      const { userId: peerId, candidate } = message;
      
      const peerConnection = peerConnectionsRef.current[peerId];
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      toast.error("Connection negotiation failed");
    }
  };
  
  // Cleanup peer connection when a user leaves
  const cleanupPeerConnection = (peerId: string) => {
    // Remove peer connection
    const peerConnection = peerConnectionsRef.current[peerId];
    if (peerConnection) {
      peerConnection.close();
      delete peerConnectionsRef.current[peerId];
    }
    
    // Remove data channel
    delete dataChannelsRef.current[peerId];
    
    // Remove remote stream
    setRemoteStreams(prev => {
      const newStreams = { ...prev };
      delete newStreams[peerId];
      return newStreams;
    });
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsAudioOn(audioTracks[0]?.enabled || false);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(videoTracks[0]?.enabled || false);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    try {
      if (isScreenSharing) {
        // Revert to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true
        });
        
        // Replace tracks in all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(stream.getVideoTracks()[0]);
          }
        });
        
        setLocalStream(stream);
        setIsScreenSharing(false);
      } else {
        // Switch to screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track in all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
          }
        });
        
        // Combine screen video with original audio
        if (localStream) {
          screenStream.addTrack(localStream.getAudioTracks()[0]);
        }
        
        setLocalStream(screenStream);
        setIsScreenSharing(true);
        
        // Handle when user stops screen sharing from browser UI
        screenStream.getVideoTracks()[0].onended = async () => {
          const newStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
          });
          
          // Replace tracks in all peer connections
          Object.values(peerConnectionsRef.current).forEach(pc => {
            const senders = pc.getSenders();
            const videoSender = senders.find(sender => sender.track?.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(newStream.getVideoTracks()[0]);
            }
          });
          
          setLocalStream(newStream);
          setIsScreenSharing(false);
        };
      }
    } catch (error) {
      console.error('Failed to toggle screen sharing:', error);
      toast.error("Failed to share screen");
    }
  };
  
  // End call and cleanup
  const endCall = () => {
    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => {
      pc.close();
    });
    peerConnectionsRef.current = {};
    
    // Close all data channels
    dataChannelsRef.current = {};
    
    // Close WebSocket connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Stop all local tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
      });
      setLocalStream(null);
    }
    
    // Clear remote streams
    setRemoteStreams({});
    
    // Reset state
    setIsAudioOn(true);
    setIsVideoOn(true);
    setIsScreenSharing(false);
    
    toast.info("Call ended");
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);
  
  return {
    localStream,
    remoteStreams,
    isAudioOn,
    isVideoOn,
    isScreenSharing,
    initializeCall,
    toggleAudio,
    toggleVideo,
    toggleScreenSharing,
    endCall
  };
};
