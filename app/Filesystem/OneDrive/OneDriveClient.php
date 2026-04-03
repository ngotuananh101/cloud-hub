<?php

namespace App\Filesystem\OneDrive;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Psr7\Utils;

class OneDriveClient
{
    protected Client $client;
    protected string $accessToken;
    protected string $baseUrl = 'https://graph.microsoft.com/v1.0/';
    protected string $driveId;

    public function __construct(string $accessToken, string $driveId = 'me')
    {
        $this->accessToken = $accessToken;
        $this->driveId = $driveId;
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->accessToken,
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function getDriveId(): string
    {
        return $this->driveId;
    }

    public function getRootUrl(): string
    {
        if ($this->driveId === 'me') {
            return "me/drive/root";
        }
        return "drives/{$this->driveId}/root";
    }

    public function getItemUrl(string $path): string
    {
        $path = $this->normalizePath($path);
        
        if ($path === '' || $path === '/') {
            return $this->getRootUrl();
        }

        return $this->getRootUrl() . ":/{$path}";
    }

    public function getMetadata(string $path)
    {
        $response = $this->client->get($this->getItemUrl($path));
        return json_decode($response->getBody()->getContents(), true);
    }

    public function listChildren(string $path)
    {
        $path = $this->normalizePath($path);
        
        if ($path === '' || $path === '/') {
            $url = $this->getRootUrl() . '/children';
        } else {
            $url = $this->getItemUrl($path) . ':/children';
        }

        $response = $this->client->get($url);
        return json_decode($response->getBody()->getContents(), true)['value'] ?? [];
    }

    public function createDirectory(string $path)
    {
        $parts = explode('/', trim($path, '/'));
        $name = array_pop($parts);
        $parentPath = implode('/', $parts);

        $url = $this->getItemUrl($parentPath) . ':/children';
        if ($parentPath === '') {
            $url = $this->getRootUrl() . '/children';
        }

        $response = $this->client->post($url, [
            'json' => [
                'name' => $name,
                'folder' => (object)[],
                '@microsoft.graph.conflictBehavior' => 'replace',
            ],
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    public function upload(string $path, $contents)
    {
        $url = $this->getItemUrl($path) . ':/content';
        
        $response = $this->client->put($url, [
            'body' => $contents,
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    public function download(string $path)
    {
        $url = $this->getItemUrl($path) . ':/content';
        $response = $this->client->get($url, ['stream' => true]);
        return $response->getBody();
    }

    public function delete(string $path)
    {
        $this->client->delete($this->getItemUrl($path));
    }

    public function move(string $source, string $destination)
    {
        $sourceUrl = $this->getItemUrl($source);
        
        $destParts = explode('/', trim($destination, '/'));
        $newName = array_pop($destParts);
        $destParentPath = implode('/', $destParts);

        $parentMetadata = $this->getMetadata($destParentPath);
        $parentId = $parentMetadata['id'];

        $response = $this->client->patch($sourceUrl, [
            'json' => [
                'parentReference' => [
                    'id' => $parentId,
                ],
                'name' => $newName,
            ],
        ]);

        return json_decode($response->getBody()->getContents(), true);
    }

    public function copy(string $source, string $destination)
    {
        $sourceUrl = $this->getItemUrl($source);
        
        $destParts = explode('/', trim($destination, '/'));
        $newName = array_pop($destParts);
        $destParentPath = implode('/', $destParts);

        $parentMetadata = $this->getMetadata($destParentPath);
        $parentId = $parentMetadata['id'];

        // Copy is asynchronous in OneDrive, returns 202 Accepted
        $this->client->post($sourceUrl . ':/copy', [
            'json' => [
                'parentReference' => [
                    'id' => $parentId,
                ],
                'name' => $newName,
            ],
        ]);
    }

    protected function normalizePath(string $path): string
    {
        return trim($path, '/');
    }
}
