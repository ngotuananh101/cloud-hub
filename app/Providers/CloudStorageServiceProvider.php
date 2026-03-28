<?php

namespace App\Providers;

use App\Filesystem\OneDrive\OneDriveAdapter;
use App\Filesystem\OneDrive\OneDriveClient;
use App\Filesystem\TelegramAdapter;
use Aws\S3\S3Client;
use Google\Service\Drive;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\ServiceProvider;
use League\Flysystem\AwsS3V3\AwsS3V3Adapter;
use League\Flysystem\AwsS3V3\PortableVisibilityConverter;
use League\Flysystem\Filesystem;
use League\Flysystem\Ftp\FtpAdapter;
use League\Flysystem\Ftp\FtpConnectionOptions;
use League\Flysystem\PhpseclibV3\SftpAdapter;
use League\Flysystem\PhpseclibV3\SftpConnectionProvider;
use League\Flysystem\WebDAV\WebDAVAdapter;
use Masbug\Flysystem\GoogleDriveAdapter;
use Sabre\DAV\Client;
use Spatie\FlysystemDropbox\DropboxAdapter;

class CloudStorageServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Storage::extend('google', function ($app, $config) {
            $client = new \Google\Client;
            $client->setClientId($config['client_id']);
            $client->setClientSecret($config['client_secret']);
            $client->refreshToken($config['refresh_token']);
            $service = new Drive($client);
            $options = $config['options'] ?? [];
            $adapter = new GoogleDriveAdapter($service, $config['folder_id'] ?? '', $options);

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('onedrive', function ($app, $config) {
            $client = new OneDriveClient(
                $config['access_token'],
                $config['drive_id'] ?? 'me'
            );

            $adapter = new OneDriveAdapter($client, $config['root'] ?? '');

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('dropbox', function ($app, $config) {
            $client = new \Spatie\Dropbox\Client(
                $config['access_token'] ?? ''
            );
            $adapter = new DropboxAdapter($client);

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('webdav', function ($app, $config) {
            $client = new Client($config);
            $adapter = new WebDAVAdapter($client, $config['pathPrefix'] ?? '');

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('ftp', function ($app, $config) {
            foreach ($config as $key => $value) {
                if ($value === 'true') {
                    $config[$key] = true;
                }
                if ($value === 'false') {
                    $config[$key] = false;
                }
            }

            $options = array_merge([
                'port' => 21,
                'ssl' => false,
                'timeout' => 90,
                'utf8' => true,
                'passive' => true,
                'transferMode' => FTP_BINARY,
                'systemType' => null,
                'ignorePassiveAddress' => null,
                'timestampsOnUnixListingsEnabled' => false,
                'recurseManually' => true,
            ], $config);

            $adapter = new FtpAdapter(
                FtpConnectionOptions::fromArray($options)
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('sftp', function ($app, $config) {
            foreach ($config as $key => $value) {
                if ($value === 'true') {
                    $config[$key] = true;
                }
                if ($value === 'false') {
                    $config[$key] = false;
                }
            }

            $options = array_merge([
                'port' => 22,
                'password' => null,
                'privateKey' => null,
                'passphrase' => null,
                'useAgent' => false,
                'timeout' => 30, // Default 30 based on user's snippet
                'maxTries' => 4,
                'hostFingerprint' => null,
                'connectivityChecker' => null,
            ], $config);

            $privateKeyPath = $options['privateKey'];

            // If the privateKey is a string containing the actual key content rather than a file path
            if (! empty($privateKeyPath) && str_contains($privateKeyPath, '-----BEGIN')) {
                // Ensure we have a secure temp directory
                $tempDir = storage_path('app/temp_keys');
                if (! is_dir($tempDir)) {
                    mkdir($tempDir, 0700, true);
                }

                $keyHash = md5($privateKeyPath);
                $tempKeyFile = $tempDir.'/sftp_key_'.$keyHash;

                if (! file_exists($tempKeyFile)) {
                    file_put_contents($tempKeyFile, $privateKeyPath);
                    chmod($tempKeyFile, 0600); // Set secure permissions required for SSH keys
                }

                $privateKeyPath = $tempKeyFile;
            }

            $provider = new SftpConnectionProvider(
                $options['host'],
                $options['username'],
                $options['password'],
                $privateKeyPath,
                $options['passphrase'],
                $options['port'],
                $options['useAgent'],
                $options['timeout'],
                $options['maxTries'],
                $options['hostFingerprint'],
                $options['connectivityChecker']
            );

            $visibilityConverter = \League\Flysystem\UnixVisibility\PortableVisibilityConverter::fromArray([
                'file' => [
                    'public' => 0640,
                    'private' => 0604,
                ],
                'dir' => [
                    'public' => 0740,
                    'private' => 07604, // Use valid octal integer, 7604 in user snippet meant 07604 or 0740
                ],
            ]);

            $adapter = new SftpAdapter(
                $provider,
                $options['root'] ?? '/',
                $visibilityConverter
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('s3', function ($app, $config) {
            $s3Config = [
                'region' => $config['region'] ?? 'us-east-1',
                'version' => 'latest',
                'use_path_style_endpoint' => $config['use_path_style_endpoint'] ?? false,
                'credentials' => [
                    'key' => $config['key'] ?? '',
                    'secret' => $config['secret'] ?? '',
                ],
            ];

            if (! empty($config['endpoint'])) {
                $s3Config['endpoint'] = $config['endpoint'];
            }

            $client = new S3Client($s3Config);

            // Normalize path_prefix: strip all leading/trailing slashes so that
            // a value of "/" (the UI default) becomes "" (no prefix), preventing
            // S3 object keys from starting with "/" which causes folders to be
            // listed with the prefix stripped and the first real character lost.
            $pathPrefix = trim($config['path_prefix'] ?? '', '/');

            $adapter = new AwsS3V3Adapter(
                $client,
                $config['bucket'] ?? '',
                $pathPrefix,
                new PortableVisibilityConverter(
                    $config['visibility'] ?? 'public'
                )
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });

        Storage::extend('telegram', function ($app, $config) {
            $adapter = new TelegramAdapter(
                $config['session_id'],
                config('cloud-hub.providers.telegram.token'),
                $config['prefix'] ?? ''
            );

            return new FilesystemAdapter(
                new Filesystem($adapter, $config),
                $adapter,
                $config
            );
        });
    }
}
