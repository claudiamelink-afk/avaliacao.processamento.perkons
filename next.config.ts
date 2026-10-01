import type { NextConfig } from "next";

const enforcedCsp=[
 "default-src 'self'",
 "script-src 'self' 'unsafe-inline'",
 "style-src 'self' 'unsafe-inline'",
 "img-src 'self' data: blob:",
 "font-src 'self' data:",
 "connect-src 'self'",
 "object-src 'none'",
 "frame-ancestors 'none'",
 "base-uri 'self'",
 "form-action 'self'",
 "upgrade-insecure-requests"
].join("; ");

const nextConfig:NextConfig={
 output:"standalone",
 serverExternalPackages:["pg"],
 poweredByHeader:false,
 async headers(){
  return[{
   source:"/:path*",
   headers:[
    {key:"Content-Security-Policy",value:enforcedCsp},
    {key:"X-Frame-Options",value:"DENY"},
    {key:"X-Content-Type-Options",value:"nosniff"},
    {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
    {key:"Permissions-Policy",value:"camera=(), microphone=(), geolocation=()"}
   ]
  }];
 }
};

export default nextConfig;
