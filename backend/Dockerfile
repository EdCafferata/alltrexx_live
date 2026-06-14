# Backend image — pakt een VOORAF gebouwde jar in (geen Maven in de build).
# Reden: Synology Container Manager heeft geen DNS tijdens build-RUN-stappen, dus
# `mvn` faalt met "Unknown host". Bouw daarom eerst lokaal op een machine met internet:
#     cd backend && mvn clean package -DskipTests        (levert target/*.jar)
# en laat Docker die alleen kopiëren — geen netwerk nodig tijdens de image-build.
# De originele multi-stage build (met maven) staat in Dockerfile.build.

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# non-root gebruiker
RUN addgroup -S alltrexx && adduser -S alltrexx -G alltrexx
RUN mkdir -p /app/logs && chown alltrexx:alltrexx /app/logs
USER alltrexx

# de lokaal gebouwde jar
COPY target/alltrexx-live-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev}", \
  "-jar", "app.jar"]
