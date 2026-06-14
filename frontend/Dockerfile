# Frontend image — pakt een VOORAF gebouwde React-build in (geen npm in de build).
# Reden: Synology Container Manager heeft geen DNS tijdens build-RUN-stappen, dus
# `npm ci` faalt met "Unknown host". Bouw daarom eerst lokaal op een machine met internet:
#     cd frontend && npm ci && npm run build        (levert build/)
# en laat Docker die alleen in nginx kopiëren — geen netwerk nodig tijdens image-build.
# De originele multi-stage build (met node) staat in Dockerfile.build.

FROM nginx:alpine
COPY build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
