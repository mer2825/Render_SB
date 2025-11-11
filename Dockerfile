# -----------------------------------------------------------------------------
# FASE 1: BUILD (Compilación)
# Usamos la imagen de Maven con Java 17 (versión 3.9.5) para compilar.
# -----------------------------------------------------------------------------
FROM maven:3.9.5-openjdk-17 AS build

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# 1. Copia solo el archivo pom.xml y descarga las dependencias (optimiza el caché)
COPY pom.xml .
RUN mvn dependency:go-offline

# 2. Copia el resto del código fuente (incluyendo la carpeta 'src/')
COPY src/ ./src/

# 3. Compila el proyecto y genera el JAR
RUN mvn clean package -DskipTests

# -----------------------------------------------------------------------------
# FASE 2: RUNTIME (Ejecución)
# Usamos una imagen base mucho más ligera para el entorno de producción.
# -----------------------------------------------------------------------------
FROM openjdk:17-jre-slim

# Crea una carpeta de trabajo
WORKDIR /app

# Copia el JAR compilado desde la fase 'build' a esta fase de 'runtime'.
# Esto asegura que el nombre del JAR (ej: acceso-0.0.1-SNAPSHOT.jar) sea irrelevante,
# ya que lo renombramos a 'app.jar'.
COPY --from=build /app/target/*.jar app.jar

# Define el comando de inicio que Render ejecutará.
# Activamos el perfil 'prod' para asegurar la configuración de la BD en Render.
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=prod"]
