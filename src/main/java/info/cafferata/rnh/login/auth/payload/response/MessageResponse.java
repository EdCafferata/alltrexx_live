package login.auth.payload.response;

// Message after validation of username and email address
public class MessageResponse {

    private String message;

    // All Args Constructor
    public MessageResponse(String message) {
        this.message = message;
    }

    // Getter and Setter
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
