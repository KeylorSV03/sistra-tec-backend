module.exports = {
    testEnvironment: "node",
    testMatch: ["**/tests/**/*.test.js"],

    collectCoverageFrom: [
        "src/**/*.js",
        "!src/server.js",
        "!src/app.js",
        "!src/config/**",
        "!src/routes/**",
        "!src/models/**",
        "!src/middleware/**",
        "!src/utils/**",
        "!src/templates/**",
        "!src/errors/**",
    ],

		coverageReporters: [
		"text-summary"
	],
    
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
};
