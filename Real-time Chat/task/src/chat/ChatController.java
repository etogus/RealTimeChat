package chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    // Maps messages sent to /app/sendMessage
    @MessageMapping("/sendMessage")
    // Return value is sent to the /topic/messages, which will broadcast it to all clients subscribed to this topic
    @SendTo("/topic/messages")
    public String sendMessage(String message) {
        return message;
    }
}
