import ROSLIB from "roslib";
import { EVENT_CONNECTED, EVENT_DISCONNECTED } from "./Constants.js";

class TopicManager {
    constructor(connection) {
        let registeredTopics = {};

        // Internal signature for the topic
        let getSignature = (name, messageType) => {
            return messageType + '/' + name;
        }

        let listen = (ros, name, messageType, signature, options) => {
            let topicOptions = {
                ros: ros,
                name: name,
                messageType: messageType
            };
            if(options.compresion) {
                topicOptions.compression = options.compresion;
            }
            
            let listener = new ROSLIB.Topic(topicOptions);
            registeredTopics[signature].listener = listener;
            registeredTopics[signature].listener.subscribe((message) => {
                let numHandlers = registeredTopics[signature].handlers.length;
                for (let i = 0; i < numHandlers; i++) {
                    // Actually invoke topic handlers
                    registeredTopics[signature].handlers[i](message);
                }
            });
        };

        let connectAndListen = (name, messageType, signature, options) => {
            return connection.getInstance().then((ros) => {
                listen(ros, name, messageType, signature, options);
            });
        };

        this.publish = (name, messageType, payload) => {
            return connection.getInstance().then((ros) => {
                let topic = new ROSLIB.Topic({
                    ros: ros,
                    name: name,
                    messageType: messageType
                });
                let message = new ROSLIB.Message(payload);
                topic.publish(message);
            });
        };

        this.subscribe = (name, messageType, handler, options = {}) => {
            let signature = getSignature(name, messageType);
            if (signature in registeredTopics) {
                // Push to existing handlers
                registeredTopics[signature].handlers.push(handler);
            } else {
                // Create handler array and start topic subscription
                registeredTopics[signature] = {
                    options: { name: name, messageType: messageType },
                    listener: undefined,
                    handlers: [handler]
                };
                connectAndListen(name, messageType, signature, options);
            }
            return {
                dispose: () => {
                    let index = registeredTopics[signature].handlers.indexOf(handler);
                    if (index !== -1) {
                        registeredTopics[signature].handlers.splice(index, 1);
                        // Close the topic, because no handlers are left
                        if (!registeredTopics[signature].handlers.length && registeredTopics[signature].listener) {
                            registeredTopics[signature].listener.unsubscribe();
                            registeredTopics[signature].listener = null;
                        }
                    }
                }
            };
        };

        connection.on(EVENT_DISCONNECTED, () => {
            // Dispose all topic listeners (not handlers!)
            for (let signature in registeredTopics) {
                let topic = registeredTopics[signature];
                if (topic.listener) {
                    topic.listener.unsubscribe();
                    topic.listener = null;
                }
            }
        });

        connection.on(EVENT_CONNECTED, (ros) => {
            // Reconnect disconnected handlers
            for (let signature in registeredTopics) {
                let topic = registeredTopics[signature];
                if (topic.listener === null && topic.handlers.length) {
                    listen(ros, topic.options.name, topic.options.messageType, signature);
                    topic.listener = null;
                }
            }
        });
    };
};

export default TopicManager;
