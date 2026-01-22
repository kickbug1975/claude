export declare const env: {
    nodeEnv: string;
    port: number;
    clientUrl: string;
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    aws: {
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        region: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        password: string;
        from: string;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
//# sourceMappingURL=env.d.ts.map