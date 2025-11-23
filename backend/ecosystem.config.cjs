module.exports = {
    apps: [
        {
            name: "time-tracker-api",
            script: "./dist/index.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 3001
            },
            watch: false,
            max_memory_restart: "1G",
            log_date_format: "YYYY-MM-DD HH:mm Z"
        }
    ]
};
