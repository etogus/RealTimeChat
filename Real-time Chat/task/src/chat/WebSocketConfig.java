package chat;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Message broker will carry the messages back to the client on destinations prefixed with /topic
        // Messages sent to /topic/messages will be broadcast to all subscribed clients
        config.enableSimpleBroker("/topic", "/user", "/queue");
        // Prefix for destinations in methods with @MessageMapping
        // Messages sent to /app/sendMessage are routed to the sendMessage method in the ChatController
        config.setApplicationDestinationPrefixes("/app");

        // Destination for a user-unique session
        //config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint for clients to connect to the WebSocket server
        registry.addEndpoint("/chat-websocket").withSockJS();
    }
}
