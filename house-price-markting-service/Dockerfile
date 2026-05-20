FROM 8wxewmnzl14gzm6b6v.xuanyuan.run/library/maven:3.9.9-eclipse-temurin-17-noble AS builder
WORKDIR /build

RUN mkdir -p /root/.m2 && cat > /root/.m2/settings.xml <<'SETTINGS'
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 https://maven.apache.org/xsd/settings-1.0.0.xsd">
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <name>aliyun maven</name>
      <url>https://maven.aliyun.com/repository/public</url>
      <mirrorOf>*</mirrorOf>
    </mirror>
  </mirrors>
</settings>
SETTINGS

COPY pom.xml ./
RUN mvn -s /root/.m2/settings.xml -B -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -s /root/.m2/settings.xml -B -DskipTests package

FROM 8wxewmnzl14gzm6b6v.xuanyuan.run/library/eclipse-temurin:17-jre
WORKDIR /app

COPY --from=builder /build/target/*.jar app.jar

EXPOSE 8003
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
