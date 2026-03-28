<?php

namespace Database\Seeders;

use App\Models\Provider;
use Illuminate\Database\Seeder;

class ProviderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $providers = [
            [
                'id' => 'google',
                'name' => 'Google Drive',
                'icon' => 'google-drive',
                'driver' => 'google',
                'config_schema' => [
                    'client_id' => 'string',
                    'client_secret' => 'string',
                    'refresh_token' => 'string',
                    'folder_id' => 'string',
                ],
                'is_active' => true,
            ],
            [
                'id' => 'onedrive',
                'name' => 'OneDrive',
                'icon' => 'onedrive',
                'driver' => 'onedrive',
                'config_schema' => [
                    'client_id' => 'string',
                    'client_secret' => 'string',
                    'refresh_token' => 'string',
                    'folder_id' => 'string',
                ],
                'is_active' => true,
            ],
            [
                'id' => 'dropbox',
                'name' => 'Dropbox',
                'icon' => 'dropbox',
                'driver' => 'dropbox',
                'config_schema' => [
                    'authorization_token' => 'string',
                ],
                'is_active' => true,
            ],
            [
                'id' => 's3',
                'name' => 'Amazon S3',
                'icon' => 'aws-s3',
                'driver' => 's3',
                'config_schema' => [
                    'key' => 'string',
                    'secret' => 'string',
                    'region' => 'string',
                    'bucket' => 'string',
                    'endpoint' => 'string',
                    'path_prefix' => 'string',
                    'visibility' => ['public', 'private'],
                    'use_path_style_endpoint' => ['true', 'false'],
                ],
                'default_config_schema' => [
                    'region' => 'vn-1',
                    'path_prefix' => '/',
                    'visibility' => 'public',
                    'use_path_style_endpoint' => 'true',
                ],
                'is_active' => true,
            ],
            [
                'id' => 'ftp',
                'name' => 'FTP',
                'icon' => 'ftp',
                'driver' => 'ftp',
                'config_schema' => [
                    'host' => 'string',
                    'username' => 'string',
                    'password' => 'string',
                    'port' => 'number',
                    'root' => 'string',
                    'ssl' => ['true', 'false'],
                    'passive' => ['true', 'false'],
                    'timeout' => 'number',
                    'utf8' => ['true', 'false'],
                    'transferMode' => 'number',
                    'ignorePassiveAddress' => ['true', 'false'],
                    'timestampsOnUnixListingsEnabled' => ['true', 'false'],
                    'recurseManually' => ['true', 'false'],
                ],
                'default_config_schema' => [
                    'port' => 21,
                    'root' => '/',
                    'ssl' => 'false',
                    'passive' => 'true',
                    'timeout' => 90,
                    'utf8' => 'true',
                    'transferMode' => 2, // FTP_BINARY
                    'ignorePassiveAddress' => 'false',
                    'timestampsOnUnixListingsEnabled' => 'false',
                    'recurseManually' => 'true',
                ],
                'is_active' => true,
            ],
            [
                'id' => 'sftp',
                'name' => 'SFTP',
                'icon' => 'sftp',
                'driver' => 'sftp',
                'config_schema' => [
                    'host' => 'string',
                    'username' => 'string',
                    'password' => 'string',
                    'privateKey' => 'string',
                    'passphrase' => 'string',
                    'port' => 'number',
                    'root' => 'string',
                    'useAgent' => ['true', 'false'],
                    'timeout' => 'number',
                    'maxTries' => 'number',
                    'hostFingerprint' => 'string',
                ],
                'default_config_schema' => [
                    'port' => 22,
                    'root' => '/',
                    'useAgent' => 'false',
                    'timeout' => 30,
                    'maxTries' => 4,
                ],
                'is_active' => true,
            ],
            [
                'id' => 'webdav',
                'name' => 'WebDAV',
                'icon' => 'webdav',
                'driver' => 'webdav',
                'config_schema' => [
                    'baseUri' => 'string',
                    'userName' => 'string',
                    'password' => 'string',
                    'pathPrefix' => 'string',
                ],
                'is_active' => true,
            ],
            [
                'id' => 'telegram',
                'name' => 'Telegram',
                'icon' => 'telegram',
                'driver' => 'telegram',
                'config_schema' => [
                    'phone' => 'string',
                    'session_id' => 'string',
                    'prefix' => 'string',
                ],
                'default_config_schema' => [
                    'prefix' => '/',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($providers as $provider) {
            Provider::updateOrCreate(['id' => $provider['id']], $provider);
        }
    }
}
