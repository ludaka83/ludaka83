module.exports = {
  apps: [
    {
      name: "tiwane-school",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        DATABASE_URL: process.env.DATABASE_URL,
        ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
        UPLOAD_DIR: process.env.UPLOAD_DIR || "public/uploads",
        NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED || "false",
        NEXT_PUBLIC_ADSENSE_CLIENT: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
        NEXT_PUBLIC_ADS_FREQUENCY: process.env.NEXT_PUBLIC_ADS_FREQUENCY || "3",
      },
    },
  ],
};

