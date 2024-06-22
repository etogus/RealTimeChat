package chat;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Controller
public class ChatController {

    private final List<Message> messages = new ArrayList<>();
    private final Map<String, String> users = new ConcurrentHashMap<>(); // Mapping sessionId to username
    private final List<String> userNames = new ArrayList<>();
    private final SimpMessagingTemplate template;

    public ChatController(SimpMessagingTemplate template) {
        this.template = template;
    }

    // Maps messages sent to /app/sendMessage
    @MessageMapping("/sendMessage")
    // Return value is sent to the /topic/messages, which will broadcast it to all clients subscribed to this topic
    @SendTo("/topic/messages")
    public Message sendMessage(Message message) {
        message.setDate(LocalDateTime.now().toString());
        messages.add(message);
        return message;
    }

    @GetMapping("/chat/messages")
    @ResponseBody
    public List<Message> getMessages() {
        return messages;
    }

    @MessageMapping("/addUser")
    public void addUser(String username, SimpMessageHeaderAccessor headerAccessor) {
        String sessionId = headerAccessor.getSessionId();
        users.put(sessionId, username);
        headerAccessor.getSessionAttributes().put("username", username);
        userNames.add(username);
        broadcastUserList();
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (users.containsKey(sessionId)) {
            userNames.remove(users.get(sessionId));
            users.remove(sessionId);
            broadcastUserList();
        }
    }

    private void broadcastUserList() {
        template.convertAndSend("/topic/users", userNames);
    }
}
