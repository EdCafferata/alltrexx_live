# ── Stap 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies eerst (betere Docker cache)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stap 2: Runtime (kleiner image) ──────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Maak een non-root gebruiker
RUN addgroup -S alltrexx && adduser -S alltrexx -G alltrexx
USER alltrexx

COPY --from=build /app/target/*.jar app.jar

# Logs map
RUN mkdir -p /app/logs

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev}", \
  "-jar", "app.jar"]
