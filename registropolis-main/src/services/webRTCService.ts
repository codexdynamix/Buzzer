
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

type WebRTCCallbacks = {
  onUserOnline?: (user: any) => void;
  onUserOffline?: (user: any) => void;
  onIncomingCall?: (from: string, offer: RTCSessionDescriptionInit) => void;
  onCallAccepted?: (from: string, answer: RTCSessionDescriptionInit) => void;
  onCallRejected?: (from: string, reason?: string) => void;
  onCallEnded?: (from: string) => void;
  onIceCandidate?: (from: string, candidate: RTCIceCandidate) => void;
};

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks = {};
  private userId: string | null = null;
  private username: string | null = null;
  
  // Initialize the service
  public init(userId: string, username: string): void {
    this.userId = userId;
    this.username = username;
    
    // Connect to signaling server
    this.socket = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('auth_token') || ''
      }
    });
    
    // Set up socket event listeners
    this.setupSocketListeners();
    
    // Register user with the signaling server
    this.socket.emit('register', { userId, username });
  }
  
  // Set up all socket event listeners
  private setupSocketListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('Connected to signaling server');
      toast.success('Connected to call service');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from signaling server');
      toast.error('Disconnected from call service');
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      toast.error('Failed to connect to call service');
    });
    
    // WebRTC signaling
    
    // User online/offline events
    this.socket.on('user:online', (user) => {
      console.log('User online:', user);
      if (this.callbacks.onUserOnline) {
        this.callbacks.onUserOnline(user);
      }
    });
    
    this.socket.on('user:offline', (user) => {
      console.log('User offline:', user);
      if (this.callbacks.onUserOffline) {
        this.callbacks.onUserOffline(user);
      }
    });
    
    this.socket.on('users:online', (users) => {
      console.log('Online users:', users);
    });
    
    // Call signaling
    this.socket.on('call:offer', ({ from, offer }) => {
      console.log('Received call offer from:', from);
      if (this.callbacks.onIncomingCall) {
        this.callbacks.onIncomingCall(from, offer);
      }
    });
    
    this.socket.on('call:answer', ({ from, answer }) => {
      console.log('Call accepted by:', from);
      
      // Set remote description based on the answer
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
          .then(() => {
            console.log('Remote description set successfully');
            if (this.callbacks.onCallAccepted) {
              this.callbacks.onCallAccepted(from, answer);
            }
          })
          .catch(err => console.error('Error setting remote description:', err));
      }
    });
    
    this.socket.on('call:ice', ({ from, candidate }) => {
      console.log('Received ICE candidate from:', from);
      
      const peerConnection = this.peerConnections.get(from);
      if (peerConnection) {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .catch(err => console.error('Error adding ICE candidate:', err));
      }
      
      if (this.callbacks.onIceCandidate) {
        this.callbacks.onIceCandidate(from, candidate);
      }
    });
    
    this.socket.on('call:end', ({ from }) => {
      console.log('Call ended by:', from);
      
      // Clean up the peer connection
      this.closePeerConnection(from);
      
      if (this.callbacks.onCallEnded) {
        this.callbacks.onCallEnded(from);
      }
    });
  }
  
  // Set callbacks for events
  public setCallbacks(callbacks: WebRTCCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Get local media stream
  public async getLocalStream(audio: boolean = true, video: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
      return this.localStream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }
  
  // Initialize a peer connection for a specific user
  private createPeerConnection(targetUserId: string): RTCPeerConnection {
    // ICE servers configuration (STUN/TURN)
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
        // Add TURN servers in production
      ]
    };
    
    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }
    
    // ICE candidate event
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', targetUserId);
        
        this.socket?.emit('call:ice', {
          to: targetUserId,
          from: this.userId,
          candidate: event.candidate
        });
      }
    };
    
    // ICE connection state change
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };
    
    // Track event - when we receive streams from the remote peer
    peerConnection.ontrack = (event) => {
      console.log('Received remote track');
      // Handle remote tracks (e.g., display video)
      const [remoteStream] = event.streams;
      
      // This can be used to display the remote video
      // Handle this externally through callbacks
    };
    
    // Store the connection
    this.peerConnections.set(targetUserId, peerConnection);
    
    return peerConnection;
  }
  
  // Make a call to another user
  public async callUser(targetUserId: string): Promise<void> {
    if (!this.socket || !this.userId) {
      throw new Error('Not connected to signaling server');
    }
    
    // Ensure we have a local stream
    if (!this.localStream) {
      try {
        await this.getLocalStream();
      } catch (error) {
        console.error('Failed to get local stream:', error);
        toast.error('Failed to access camera/microphone');
        throw error;
      }
    }
    
    // Create a peer connection for this call
    const peerConnection = this.createPeerConnection(targetUserId);
    
    try {
      // Create an offer
      const offer = await peerConnection.createOffer();
      
      // Set local description
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer to the target user through the signaling server
      this.socket.emit('call:offer', {
        to: targetUserId,
        from: this.userId,
        offer
      });
      
      console.log('Call offer sent to:', targetUserId);
    } catch (error) {
      console.error('Error creating or sending offer:', error);
      this.closePeerConnection(targetUserId);
      throw error;
    }
  }
  
  // Answer an incoming call
  public async answerCall(callerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.socket || !this.userId) {
      throw new Error('Not connected to signaling server');
    }
    
    // Ensure we have a local stream
    if (!this.localStream) {
      try {
        await this.getLocalStream();
      } catch (error) {
        console.error('Failed to get local stream:', error);
        toast.error('Failed to access camera/microphone');
        throw error;
      }
    }
    
    // Create a peer connection for this call
    const peerConnection = this.createPeerConnection(callerId);
    
    try {
      // Set remote description based on the offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create an answer
      const answer = await peerConnection.createAnswer();
      
      // Set local description
      await peerConnection.setLocalDescription(answer);
      
      // Send the answer back to the caller
      this.socket.emit('call:answer', {
        to: callerId,
        from: this.userId,
        answer
      });
      
      console.log('Call answer sent to:', callerId);
    } catch (error) {
      console.error('Error creating or sending answer:', error);
      this.closePeerConnection(callerId);
      throw error;
    }
  }
  
  // End a call
  public endCall(targetUserId: string): void {
    if (!this.socket || !this.userId) {
      console.warn('Not connected to signaling server');
      return;
    }
    
    // Notify the other user
    this.socket.emit('call:end', {
      to: targetUserId,
      from: this.userId
    });
    
    // Close the peer connection
    this.closePeerConnection(targetUserId);
  }
  
  // Close a specific peer connection
  private closePeerConnection(userId: string): void {
    const peerConnection = this.peerConnections.get(userId);
    
    if (peerConnection) {
      peerConnection.onicecandidate = null;
      peerConnection.oniceconnectionstatechange = null;
      peerConnection.ontrack = null;
      
      peerConnection.close();
      this.peerConnections.delete(userId);
      
      console.log(`Closed peer connection with ${userId}`);
    }
  }
  
  // Clean up all resources
  public cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((_, userId) => {
      this.closePeerConnection(userId);
    });
    
    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.userId = null;
    this.username = null;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
