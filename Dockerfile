# Usa una imagen base oficial de Java (OpenJDK 17 con Maven)
FROM maven:3-openjdk-17
# Establece el directorio de trabajo
WORKDIR /app

# Copia el archivo pom.xml y descarga las dependencias
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia el código fuente completo
COPY . .

# Compila el proyecto y genera el JAR
RUN mvn clean install -DskipTests

# Define el comando de inicio de la aplicación
ENTRYPOINT ["java", "-jar", "target/acceso-0.0.1-SNAPSHOT.jar", "--spring.profiles.active=prod"]
