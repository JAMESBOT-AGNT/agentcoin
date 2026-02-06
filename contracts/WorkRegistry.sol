// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./IAgentCoin.sol";

/**
 * @title WorkRegistry
 * @dev Manages work requests between agents with escrow and token minting capabilities
 */
contract WorkRegistry is ReentrancyGuard, Pausable {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    IAgentCoin public immutable agentCoin;
    
    // Work statuses
    enum WorkStatus {
        Created,        // Work created and waiting acceptance
        InProgress,     // Work accepted and in progress
        Completed,      // Work marked as completed
        Disputed,       // Work is in dispute
        Resolved,       // Dispute resolved
        Cancelled       // Work cancelled
    }
    
    // Payment types
    enum PaymentType {
        TokenPayment,   // Payment with existing tokens
        MintReward      // Mint new tokens as reward
    }
    
    // Work structure
    struct Work {
        uint256 id;
        address requester;      // Agent A (who requests work)
        address worker;         // Agent B (who performs work)
        string description;     // Work specifications
        uint256 amount;         // Amount in AGNT tokens
        PaymentType paymentType;
        uint256 deadline;       // Unix timestamp
        WorkStatus status;
        uint256 createdAt;
        uint256 completedAt;
        bool isDisputed;
        address disputeWinner;
    }
    
    // Agent reputation and stats
    struct AgentStats {
        uint256 completedWorks;
        uint256 disputes;
        uint256 wins;
        uint256 totalEarned;
        uint256 reputationScore;
        uint256 lastWorkTime;
        uint256 mintedThisMonth;
        uint256 lastMintReset;
    }
    
    // Storage
    mapping(uint256 => Work) public works;
    mapping(address => AgentStats) public agentStats;
    mapping(address => mapping(address => uint256)) public lastJobBetweenAgents;
    mapping(address => uint256[]) public agentWorks;
    
    uint256 public nextWorkId = 1;
    uint256 public constant COOLDOWN_PERIOD = 24 hours;
    uint256 public constant DISPUTE_TIMEOUT = 7 days;
    uint256 public constant AUTO_COMPLETE_TIMEOUT = 14 days;
    uint256 public constant MONTHLY_MINT_LIMIT = 1000e18; // 1000 AGNT per month
    uint256 public constant REPUTATION_THRESHOLD = 100;
    
    // Configurable parameters
    uint256 public mintRate = 1e18; // 1 AGNT per unit of work
    uint256 public escrowFee = 25; // 0.25% (25/10000)
    address public feeRecipient;
    address public arbitrator;
    
    // Events
    event WorkCreated(
        uint256 indexed workId,
        address indexed requester,
        address indexed worker,
        uint256 amount,
        PaymentType paymentType,
        uint256 deadline
    );
    
    event WorkAccepted(uint256 indexed workId, address indexed worker);
    event WorkCompleted(uint256 indexed workId, address indexed completer);
    event WorkDisputed(uint256 indexed workId, address indexed disputer);
    event DisputeResolved(uint256 indexed workId, address indexed winner);
    event PaymentReleased(uint256 indexed workId, address indexed recipient, uint256 amount);
    event TokensMinted(uint256 indexed workId, address indexed recipient, uint256 amount);
    event ReputationUpdated(address indexed agent, uint256 newScore);
    
    constructor(
        address _agentCoin,
        address _arbitrator,
        address _feeRecipient
    ) {
        require(_agentCoin != address(0), "Invalid token address");
        require(_arbitrator != address(0), "Invalid arbitrator address");
        require(_feeRecipient != address(0), "Invalid fee recipient address");
        
        agentCoin = IAgentCoin(_agentCoin);
        arbitrator = _arbitrator;
        feeRecipient = _feeRecipient;
        owner = msg.sender;
    }
    
    // Modifiers
    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator can call this");
        _;
    }
    
    modifier validWork(uint256 workId) {
        require(workId > 0 && workId < nextWorkId, "Invalid work ID");
        _;
    }
    
    modifier onlyRequester(uint256 workId) {
        require(works[workId].requester == msg.sender, "Only requester can call this");
        _;
    }
    
    modifier onlyWorker(uint256 workId) {
        require(works[workId].worker == msg.sender, "Only worker can call this");
        _;
    }
    
    modifier onlyParticipant(uint256 workId) {
        Work storage work = works[workId];
        require(
            work.requester == msg.sender || work.worker == msg.sender,
            "Only work participants can call this"
        );
        _;
    }
    
    /**
     * @dev Creates a new work request
     * @param worker Address of the agent who will perform the work
     * @param description Work specifications
     * @param amount Amount to pay/mint (in wei)
     * @param paymentType Type of payment (existing tokens or mint new)
     * @param deadline Unix timestamp deadline
     */
    function createWork(
        address worker,
        string memory description,
        uint256 amount,
        PaymentType paymentType,
        uint256 deadline
    ) external payable whenNotPaused nonReentrant returns (uint256 workId) {
        require(worker != address(0), "Invalid worker address");
        require(worker != msg.sender, "Cannot create work for yourself");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(amount > 0, "Amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        
        // Check cooldown between same agents
        require(
            block.timestamp >= lastJobBetweenAgents[msg.sender][worker] + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );
        
        // Check monthly mint limit for mint rewards
        if (paymentType == PaymentType.MintReward) {
            _checkMintLimit(worker, amount);
        }
        
        workId = nextWorkId++;
        
        works[workId] = Work({
            id: workId,
            requester: msg.sender,
            worker: worker,
            description: description,
            amount: amount,
            paymentType: paymentType,
            deadline: deadline,
            status: WorkStatus.Created,
            createdAt: block.timestamp,
            completedAt: 0,
            isDisputed: false,
            disputeWinner: address(0)
        });
        
        // Add to agent's work list
        agentWorks[msg.sender].push(workId);
        agentWorks[worker].push(workId);
        
        // Handle escrow for token payments
        if (paymentType == PaymentType.TokenPayment) {
            uint256 fee = (amount * escrowFee) / 10000;
            uint256 totalAmount = amount + fee;
            
            require(
                agentCoin.transferFrom(msg.sender, address(this), totalAmount),
                "Token transfer failed"
            );
            
            // Transfer fee to fee recipient
            if (fee > 0) {
                require(agentCoin.transfer(feeRecipient, fee), "Fee transfer failed");
            }
        }
        
        emit WorkCreated(workId, msg.sender, worker, amount, paymentType, deadline);
        
        return workId;
    }
    
    /**
     * @dev Worker accepts the work and starts working
     * @param workId ID of the work to accept
     */
    function acceptWork(uint256 workId) 
        external 
        validWork(workId) 
        onlyWorker(workId) 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(work.status == WorkStatus.Created, "Work not available for acceptance");
        require(block.timestamp <= work.deadline, "Work deadline passed");
        
        work.status = WorkStatus.InProgress;
        lastJobBetweenAgents[work.requester][work.worker] = block.timestamp;
        
        emit WorkAccepted(workId, msg.sender);
    }
    
    /**
     * @dev Marks work as completed (can be called by worker or auto-completed by timeout)
     * @param workId ID of the work to complete
     */
    function completeWork(uint256 workId) 
        external 
        validWork(workId) 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(
            work.status == WorkStatus.InProgress,
            "Work not in progress"
        );
        
        // Worker can complete, or anyone can auto-complete after timeout
        if (msg.sender == work.worker) {
            // Worker completing work
            work.status = WorkStatus.Completed;
            work.completedAt = block.timestamp;
        } else {
            // Auto-complete after timeout (if no dispute)
            require(
                block.timestamp >= work.deadline + AUTO_COMPLETE_TIMEOUT,
                "Auto-complete timeout not reached"
            );
            require(!work.isDisputed, "Cannot auto-complete disputed work");
            
            work.status = WorkStatus.Completed;
            work.completedAt = block.timestamp;
        }
        
        emit WorkCompleted(workId, msg.sender);
        
        // Process payment/minting after completion verification period
        _processWorkCompletion(workId);
    }
    
    /**
     * @dev Requester confirms work completion and releases payment
     * @param workId ID of the work to confirm
     */
    function confirmWorkCompletion(uint256 workId) 
        external 
        validWork(workId) 
        onlyRequester(workId) 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(work.status == WorkStatus.Completed, "Work not completed");
        
        _processWorkCompletion(workId);
    }
    
    /**
     * @dev Initiates a dispute for the work
     * @param workId ID of the work to dispute
     */
    function disputeWork(uint256 workId) 
        external 
        validWork(workId) 
        onlyParticipant(workId) 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(
            work.status == WorkStatus.InProgress || work.status == WorkStatus.Completed,
            "Work not disputable"
        );
        require(!work.isDisputed, "Work already disputed");
        require(
            block.timestamp <= work.deadline + DISPUTE_TIMEOUT,
            "Dispute period expired"
        );
        
        work.status = WorkStatus.Disputed;
        work.isDisputed = true;
        
        emit WorkDisputed(workId, msg.sender);
    }
    
    /**
     * @dev Arbitrator resolves a dispute
     * @param workId ID of the disputed work
     * @param winner Address of the winning party
     */
    function resolveDispute(uint256 workId, address winner) 
        external 
        validWork(workId) 
        onlyArbitrator 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(work.status == WorkStatus.Disputed, "Work not disputed");
        require(
            winner == work.requester || winner == work.worker,
            "Winner must be a participant"
        );
        
        work.status = WorkStatus.Resolved;
        work.disputeWinner = winner;
        
        // Update reputation scores
        if (winner == work.worker) {
            agentStats[work.worker].wins++;
            agentStats[work.requester].disputes++;
        } else {
            agentStats[work.requester].wins++;
            agentStats[work.worker].disputes++;
        }
        
        _updateReputation(work.worker);
        _updateReputation(work.requester);
        
        // Process payment based on dispute outcome
        if (winner == work.worker) {
            _processWorkCompletion(workId);
        } else if (work.paymentType == PaymentType.TokenPayment) {
            // Refund escrowed tokens to requester
            require(agentCoin.transfer(work.requester, work.amount), "Refund failed");
            emit PaymentReleased(workId, work.requester, work.amount);
        }
        
        emit DisputeResolved(workId, winner);
    }
    
    /**
     * @dev Cancels a work request (only before acceptance)
     * @param workId ID of the work to cancel
     */
    function cancelWork(uint256 workId) 
        external 
        validWork(workId) 
        onlyRequester(workId) 
        whenNotPaused 
    {
        Work storage work = works[workId];
        require(work.status == WorkStatus.Created, "Work cannot be cancelled");
        
        work.status = WorkStatus.Cancelled;
        
        // Refund escrowed tokens if applicable
        if (work.paymentType == PaymentType.TokenPayment) {
            require(agentCoin.transfer(work.requester, work.amount), "Refund failed");
            emit PaymentReleased(workId, work.requester, work.amount);
        }
    }
    
    /**
     * @dev Internal function to process work completion and payment
     * @param workId ID of the work to process
     */
    function _processWorkCompletion(uint256 workId) internal {
        Work storage work = works[workId];
        address worker = work.worker;
        uint256 amount = work.amount;
        
        // Update agent stats
        agentStats[worker].completedWorks++;
        agentStats[worker].totalEarned += amount;
        agentStats[worker].lastWorkTime = block.timestamp;
        
        _updateReputation(worker);
        _updateReputation(work.requester);
        
        // Process payment
        if (work.paymentType == PaymentType.TokenPayment) {
            // Release escrowed tokens
            require(agentCoin.transfer(worker, amount), "Payment transfer failed");
            emit PaymentReleased(workId, worker, amount);
        } else {
            // Mint new tokens
            _mintReward(worker, amount);
            emit TokensMinted(workId, worker, amount);
        }
    }
    
    /**
     * @dev Internal function to mint reward tokens
     * @param recipient Address to receive minted tokens
     * @param amount Amount to mint
     */
    function _mintReward(address recipient, uint256 amount) internal {
        AgentStats storage stats = agentStats[recipient];
        
        // Update monthly mint tracking
        if (block.timestamp >= stats.lastMintReset + 30 days) {
            stats.mintedThisMonth = 0;
            stats.lastMintReset = block.timestamp;
        }
        
        stats.mintedThisMonth += amount;
        agentCoin.mint(recipient, amount, "work_completed");
    }
    
    /**
     * @dev Internal function to check monthly mint limits
     * @param agent Address of the agent
     * @param amount Amount to be minted
     */
    function _checkMintLimit(address agent, uint256 amount) internal view {
        AgentStats storage stats = agentStats[agent];
        
        uint256 currentMinted = stats.mintedThisMonth;
        if (block.timestamp >= stats.lastMintReset + 30 days) {
            currentMinted = 0;
        }
        
        require(
            currentMinted + amount <= MONTHLY_MINT_LIMIT,
            "Monthly mint limit exceeded"
        );
    }
    
    /**
     * @dev Internal function to update agent reputation
     * @param agent Address of the agent
     */
    function _updateReputation(address agent) internal {
        AgentStats storage stats = agentStats[agent];
        
        // Simple reputation calculation
        // Base score from completed works, penalty for disputes
        uint256 baseScore = stats.completedWorks * 10;
        uint256 disputePenalty = stats.disputes * 20;
        uint256 winBonus = stats.wins * 5;
        
        if (baseScore + winBonus > disputePenalty) {
            stats.reputationScore = baseScore + winBonus - disputePenalty;
        } else {
            stats.reputationScore = 0;
        }
        
        emit ReputationUpdated(agent, stats.reputationScore);
    }
    
    // View functions
    
    /**
     * @dev Gets work details
     * @param workId ID of the work
     */
    function getWork(uint256 workId) external view validWork(workId) returns (Work memory) {
        return works[workId];
    }
    
    /**
     * @dev Gets agent statistics
     * @param agent Address of the agent
     */
    function getAgentStats(address agent) external view returns (AgentStats memory) {
        return agentStats[agent];
    }
    
    /**
     * @dev Gets all work IDs for an agent
     * @param agent Address of the agent
     */
    function getAgentWorks(address agent) external view returns (uint256[] memory) {
        return agentWorks[agent];
    }
    
    /**
     * @dev Checks if agents can work together (cooldown check)
     * @param requester Address of the requester
     * @param worker Address of the worker
     */
    function canWorkTogether(address requester, address worker) external view returns (bool) {
        return block.timestamp >= lastJobBetweenAgents[requester][worker] + COOLDOWN_PERIOD;
    }
    
    /**
     * @dev Gets remaining monthly mint allowance for an agent
     * @param agent Address of the agent
     */
    function getRemainingMintAllowance(address agent) external view returns (uint256) {
        AgentStats storage stats = agentStats[agent];
        
        uint256 currentMinted = stats.mintedThisMonth;
        if (block.timestamp >= stats.lastMintReset + 30 days) {
            currentMinted = 0;
        }
        
        if (currentMinted >= MONTHLY_MINT_LIMIT) {
            return 0;
        }
        
        return MONTHLY_MINT_LIMIT - currentMinted;
    }
    
    // Admin functions
    
    /**
     * @dev Updates mint rate (only owner)
     * @param newRate New mint rate
     */
    function setMintRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "Mint rate must be positive");
        mintRate = newRate;
    }
    
    /**
     * @dev Updates escrow fee (only owner)
     * @param newFee New escrow fee (in basis points)
     */
    function setEscrowFee(uint256 newFee) external onlyOwner {
        require(newFee <= 500, "Fee cannot exceed 5%"); // Max 5%
        escrowFee = newFee;
    }
    
    /**
     * @dev Updates arbitrator address (only owner)
     * @param newArbitrator New arbitrator address
     */
    function setArbitrator(address newArbitrator) external onlyOwner {
        require(newArbitrator != address(0), "Invalid arbitrator address");
        arbitrator = newArbitrator;
    }
    
    /**
     * @dev Updates fee recipient address (only owner)
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = newFeeRecipient;
    }
    
    /**
     * @dev Emergency pause (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Emergency withdrawal of stuck tokens (only owner)
     * @param token Address of token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(token != address(0), "Invalid token address");
        IAgentCoin(token).transfer(owner, amount);
    }
}