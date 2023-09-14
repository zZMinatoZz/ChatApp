const generateMessage = (username, text) => {
    return {
        username,
        text,
        // getTime() return the time with timestamp format
        createdAt: new Date().getTime()
    }
}

const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = {
    generateMessage,
    generateLocationMessage
}