import { AnyJson } from "@iarna/toml";
import { ConfigurationMapper, ConfigurationMapperProps, filter, isEmpty } from "../../src";

describe("ConfigurationMapper", () => {
  it("Should return empty map", () => {
    // Given
    const props: ConfigurationMapperProps = {
      globalConfiguration: {},
      runnersConfiguration: [
        {
          docker: {
            allowedImages: [],
          },
          machine: {
            autoscaling: [],
          },
          cache: {
            s3: {},
          },
        },
      ],
    };

    // When
    const mapper = ConfigurationMapper.fromProps(props);
    const actual = mapper._toJsonMap();

    // Then
    expect(actual).toEqual({}); // Must be empty
  });

  it("Should filter undefined and nullables", () => {
    // Given
    const props: ConfigurationMapperProps = {
      globalConfiguration: {
        logFormat: undefined,
      },
      runnersConfiguration: [
        {
          docker: {},
          machine: {
            machineOptions: {
              blockDurationMinutes: undefined,
            },
            autoscaling: [],
          },
          cache: {
            s3: {},
          },
        },
      ],
    };

    // When
    const mapper = ConfigurationMapper.fromProps(props);
    const actual = mapper._toJsonMap();

    // Then
    expect(actual).toEqual({}); // Must be empty
  });

  it("Should return map with defaults", () => {
    // Given
    const props: ConfigurationMapperProps = {
      globalConfiguration: {},
      runnersConfiguration: [
        {
          docker: {},
          machine: {
            autoscaling: [],
          },
          cache: {
            s3: {},
          },
        },
      ],
    };

    // When
    const mapper = ConfigurationMapper.withDefaults(props);
    const actual = mapper._toJsonMap();

    // Then
    expect(actual).toEqual({
      check_interval: 0,
      concurrent: 10,
      log_format: "runner",
      log_level: "info",
      runners: [
        {
          environment: ["DOCKER_DRIVER=overlay2", "DOCKER_TLS_CERTDIR=/certs"],
          executor: "docker+machine",
          limit: 10,
          output_limit: 52428800,
          url: "https://gitlab.com",
          docker: {
            tls_verify: false,
            image: "docker:19.03.5",
            privileged: true,
            cap_add: ["CAP_SYS_ADMIN"],
            wait_for_services_timeout: 300,
            disable_cache: false,
            volumes: ["/certs/client", "/cache"],
            shm_size: 0,
          },
          machine: {
            IdleCount: 0,
            IdleTime: 300,
            MaxBuilds: 20,
            MachineDriver: "amazonec2",
            MachineName: "gitlab-runner-%s",
            MachineOptions: ["amazonec2-request-spot-instance=true", "amazonec2-spot-price=0.03"],
            autoscaling: [{ Periods: ["* * 7-22 * * mon-fri *"], IdleCount: 1, IdleTime: 1800, Timezone: "Etc/UTC" }],
          },
        },
      ],
    });
  });
  it("Should map snapshot with defaults", () => {
    // Given
    const props: ConfigurationMapperProps = {
      globalConfiguration: {},
      runnersConfiguration: [
        {
          token: "foo+bar",
          docker: {},
          machine: {
            autoscaling: [],
          },
          cache: {
            s3: {
              serverAddress: "s3.amazonaws.com",
              bucketName: "gitlab-runner-cahe-bucket-test-us-east-1",
              bucketLocation: "us-east-1",
              accessKey: "AKIAIOSFODNN7EXAMPLE",
              secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            },
          },
        },
      ],
    };

    // When
    const mapper = ConfigurationMapper.withDefaults(props);
    const actual = mapper.toToml();

    // Then
    expect(actual).toMatchSnapshot();
  });
  it("Should filter out empty values", () => {
    // Given
    const props: AnyJson = {
      array: [{ empty: undefined }],
    } as unknown as AnyJson;

    // When
    const actual = filter(props, (item) => !isEmpty(item));

    // Then
    expect(actual).toEqual({});
  });
  it("Should return multiple runners configuration", () => {
    // Given
    const props: ConfigurationMapperProps = {
      globalConfiguration: {},
      runnersConfiguration: [
        {
          token: "foo+bar",
          docker: {},
          machine: {
            autoscaling: [],
          },
          cache: {
            s3: {
              serverAddress: "s3.amazonaws.com",
              bucketName: "gitlab-runner-cahe-bucket-test-us-east-1",
              bucketLocation: "us-east-1",
              accessKey: "AKIAIOSFODNN7EXAMPLE",
              secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            },
          },
        },
        {
          token: "2foo+bar",
          docker: {},
          machine: {
            autoscaling: [],
          },
          cache: {
            s3: {
              serverAddress: "2s3.amazonaws.com",
              bucketName: "2gitlab-runner-cahe-bucket-test-us-east-1",
              bucketLocation: "2us-east-1",
              accessKey: "2AKIAIOSFODNN7EXAMPLE",
              secretKey: "2wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
            },
          },
        },
      ],
    };

    // When
    const mapper = ConfigurationMapper.withDefaults(props);
    const actual = mapper.toToml();

    // Then
    expect(actual).toMatchSnapshot();
  });
});
