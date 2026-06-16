// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Astrogalaxy — Contrato de NFTs
// Lenguaje: Solidity  ·  Estándar: ERC-721
//
// Cada reto ambiental aprobado por la IA emite una NFT al estudiante o grado.
// Los retos premium ($15/mes) emiten NFTs marcadas como "unique".
//
// Compilar/desplegar con Hardhat o Foundry. Redes sugeridas: Polygon / Base.

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AstroNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // tokenId => rareza ("common" | "rare" | "unique")
    mapping(uint256 => string) public rarityOf;

    event ChallengeNftMinted(
        address indexed to,
        uint256 indexed tokenId,
        string challengeId,
        string rarity
    );

    constructor() ERC721("Astrogalaxy Challenge", "ASTRO") Ownable(msg.sender) {}

    /// @notice Emite una NFT cuando la IA aprueba la evidencia de un reto.
    /// @dev Solo el backend (owner) puede mintear, tras verificar la evidencia.
    function mintChallenge(
        address to,
        string memory tokenURI,
        string memory challengeId,
        string memory rarity
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        rarityOf[tokenId] = rarity;

        emit ChallengeNftMinted(to, tokenId, challengeId, rarity);
        return tokenId;
    }

    /// @notice Total de NFTs emitidas.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId;
    }
}
